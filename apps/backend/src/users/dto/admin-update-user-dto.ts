import { IsEmail, IsOptional, IsEnum, IsInt, IsString, IsBoolean } from 'class-validator';
import { Role } from '@/auth/auth.types';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;


  @IsOptional()
  @IsInt()
  sectionId?: number;


  @IsOptional()
  @IsEnum(Specialization)
  specialization?: Specialization;
}
