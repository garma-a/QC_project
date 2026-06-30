import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ---- Signup flow ----

export class CheckEmailDto {
  @ApiProperty({ example: 'technician@hospital.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifySignupOtpDto {
  @ApiProperty({ example: 'technician@hospital.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP sent to email' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}

export class CompleteSignupDto {
  @ApiProperty({ example: 'technician@hospital.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'StrongPassword123!', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

// ---- Forgot password flow ----

export class ForgotPasswordDto {
  @ApiProperty({ example: 'technician@hospital.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyResetOtpDto {
  @ApiProperty({ example: 'technician@hospital.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '654321', description: '6-digit OTP sent to email' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'technician@hospital.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'NewStrongPassword123!', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
