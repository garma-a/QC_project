import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role } from '@/auth/auth.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateUserDto {
  /** User's first name */
  @ApiPropertyOptional({
    description: "User's first name",
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  /** User's last name */
  @ApiPropertyOptional({
    description: "User's last name",
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  /** User's email address */
  @ApiPropertyOptional({
    description: "User's email address",
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  /** User's role */
  @ApiPropertyOptional({
    enum: Role,
    enumName: 'UserRole',
    description: "User's role",
    example: Role.ADMIN,
    type: () => String, // Crucial to prevent the circular dependency crash
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  /** Whether the user is active */
  @ApiPropertyOptional({
    description: 'Whether the user is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Section IDs the user belongs to */
  @ApiPropertyOptional({
    description: 'Section IDs the user belongs to',
    example: [1, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  sectionIds?: number[];
}
