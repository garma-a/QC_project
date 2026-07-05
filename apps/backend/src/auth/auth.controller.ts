import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { LoginResponseDto, RefreshTokenDto, WhitelistedEmailDto } from '@/auth/dto/auth-response.dto';
import {
  CheckEmailDto,
  VerifySignupOtpDto,
  CompleteSignupDto,
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from '@/auth/dto/otp.dto';
import {
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '@/common/dto/error-response.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/auth.types';
import { CurrentUser } from '@/users/user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Login ─────────────────────────────────────────────────────────────

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate a user with email and password. Returns JWT tokens on success.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful.', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed.', type: ValidationErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials.', type: UnauthorizedResponseDto })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ─── Signup flow ───────────────────────────────────────────────────────

  @Post('signup/check-email')
  @ApiOperation({
    summary: 'Step 1 – Check email whitelist & send OTP',
    description:
      'Verifies the email is on the admin whitelist. If approved, sends a 6-digit OTP to the email.',
  })
  @ApiBody({ type: CheckEmailDto })
  @ApiResponse({ status: 200, description: 'OTP sent.' })
  @ApiResponse({ status: 400, description: 'Email not whitelisted or already registered.' })
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.initiateSignup(dto.email);
  }

  @Post('signup/verify-otp')
  @ApiOperation({
    summary: 'Step 2 – Verify signup OTP',
    description: 'Validates the 6-digit OTP. Marks it as verified for the complete-signup step.',
  })
  @ApiBody({ type: VerifySignupOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  verifySignupOtp(@Body() dto: VerifySignupOtpDto) {
    return this.authService.verifySignupOtp(dto);
  }

  @Post('signup/complete')
  @ApiOperation({
    summary: 'Step 3 – Complete signup with name & password',
    description:
      'Creates the account and returns JWT tokens. Requires prior OTP verification.',
  })
  @ApiBody({ type: CompleteSignupDto })
  @ApiResponse({ status: 201, description: 'Account created. Returns JWT tokens.', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'OTP not verified or validation failed.' })
  completeSignup(@Body() dto: CompleteSignupDto) {
    return this.authService.completeSignup(dto);
  }

  // ─── Forgot password flow ──────────────────────────────────────────────

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Step 1 – Request password-reset OTP',
    description: 'Sends a 6-digit OTP to the registered email for password reset.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'OTP sent (or silently ignored for unregistered emails).' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('forgot-password/verify-otp')
  @ApiOperation({
    summary: 'Step 2 – Verify password-reset OTP',
    description: 'Validates the OTP. Marks it verified for the reset step.',
  })
  @ApiBody({ type: VerifyResetOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Post('forgot-password/reset')
  @ApiOperation({
    summary: 'Step 3 – Set new password',
    description: 'Sets the new password after OTP verification.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password updated.' })
  @ApiResponse({ status: 400, description: 'OTP not verified or validation failed.' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─── Whitelist management (admin) ──────────────────────────────────────

  @Post('whitelist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add email to whitelist (admin only)',
    description: 'Allows an admin to whitelist a technician email so they can register.',
  })
  @ApiBody({ schema: { example: { email: 'technician@hospital.com' } } })
  @ApiResponse({ status: 201, description: 'Email added to whitelist.' })
  @ApiResponse({ status: 409, description: 'Email already whitelisted or user exists.' })
  addToWhitelist(
    @Body() dto: CheckEmailDto,
    @CurrentUser('userId') adminId: number,
  ) {
    return this.authService.addEmailToWhitelist(dto.email, adminId);
  }

  @Get('whitelist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all whitelisted emails (admin only)',
    description: 'Returns the list of all emails that have been whitelisted for registration.',
  })
  @ApiResponse({ status: 200, description: 'List of whitelisted emails.', type: [WhitelistedEmailDto] })
  getWhitelist() {
    return this.authService.getWhitelistedEmails();
  }

  @Delete('whitelist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove email from whitelist (admin only)',
    description: 'Removes an email from the whitelist. Users already registered are not affected.',
  })
  @ApiBody({ schema: { example: { email: 'technician@hospital.com' } } })
  @ApiResponse({ status: 200, description: 'Email removed from whitelist.' })
  @ApiResponse({ status: 404, description: 'Email not found on whitelist.' })
  removeFromWhitelist(@Body() dto: CheckEmailDto) {
    return this.authService.removeEmailFromWhitelist(dto.email);
  }

  // ─── Token refresh & logout ────────────────────────────────────────────

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Provide a valid refresh token to obtain a new access token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Refresh successful.', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.', type: UnauthorizedResponseDto })
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidates the provided refresh token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 204, description: 'Logout successful.' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
  }
}
