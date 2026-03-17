import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { LoginResponseDto } from '@/auth/dto/auth-response.dto';
import {
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '@/common/dto/error-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate a user with email and password. Returns a JWT access token on success. The token must be included in the `Authorization: Bearer <token>` header for all protected endpoints.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns a JWT access token.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed (e.g., missing email, invalid email format, missing password).',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account is deactivated.',
    type: UnauthorizedResponseDto,
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
