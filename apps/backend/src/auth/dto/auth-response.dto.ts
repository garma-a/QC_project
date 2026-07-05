import * as SharedTypes from '@qc/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginResponseDto implements SharedTypes.LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'JWT access token used to authenticate subsequent requests. Include in the Authorization header as: Bearer <token>',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token used to obtain a new access token when it expires.',
  })
  refreshToken: string;
}

export class WhitelistedEmailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'technician@hospital.com' })
  email: string;

  @ApiPropertyOptional({ example: 1 })
  addedBy: number | null;

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date | string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The refresh token obtained during login.',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
