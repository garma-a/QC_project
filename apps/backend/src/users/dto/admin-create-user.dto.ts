import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum, IsInt, IsBoolean } from 'class-validator';
import { Role } from '@/auth/auth.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the user account (minimum 8 characters)',
    example: 'StrongPass123!',
    minLength: 8,
  })
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Role assigned to the user',
    enum: Role,
    enumName: 'UserRole',
    type: () => String,
    example: Role.ADMIN,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Indicates if the user is active',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Section ID associated with the user',
    example: 42,
  })
  @IsOptional()
  @IsInt()
  sectionId?: number;
}

