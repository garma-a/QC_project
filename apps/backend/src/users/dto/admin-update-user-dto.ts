import { IsEmail, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from './admin-create-user.dto';

export class AdminUpdateUserDto {
  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  isActive?: boolean;
}