import { IsEmail, IsOptional, IsEnum, IsInt } from 'class-validator';
import { UserRole, Specialization } from './admin-create-user.dto';

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

  
  @IsOptional()
  @IsInt()
  sectionId?: number;

 
  @IsOptional()
  @IsEnum(Specialization)
  specialization?: Specialization;
}