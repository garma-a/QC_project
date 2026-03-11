import { IsEmail, IsOptional, IsEnum, IsInt, IsString, IsBoolean } from 'class-validator';
import { Role } from '@/auth/auth.types'; // Removed Specialization import
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateUserDto {
  /** User's first name */
  @ApiPropertyOptional({
    description: "User's first name",
    example: "John"
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  /** User's last name */
  @ApiPropertyOptional({
    description: "User's last name",
    example: "Doe"
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  /** User's email address */
  @ApiPropertyOptional({
    description: "User's email address",
    example: "john.doe@example.com"
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
    type: () => String // Crucial to prevent the circular dependency crash
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  /** Whether the user is active */
  @ApiPropertyOptional({
    description: "Whether the user is active",
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Section ID the user belongs to */
  @ApiPropertyOptional({
    description: "Section ID the user belongs to",
    example: 42,
    type: Number
  })
  @IsOptional()
  @IsInt()
  sectionId?: number;

  // REMOVED: specialization field because it's now part of Sections, not Users
}

