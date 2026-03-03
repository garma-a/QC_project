import { IsEmail, IsOptional, IsEnum, IsInt, IsString, IsBoolean } from 'class-validator';
import { Role } from '@/auth/auth.types'; // Removed Specialization import
import { ApiProperty } from '@nestjs/swagger';

export class AdminUpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    enum: Role, 
    enumName: 'UserRole', 
    required: false,
    type: () => String // Crucial to prevent the circular dependency crash
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sectionId?: number;

  // REMOVED: specialization field because it's now part of Sections, not Users
}