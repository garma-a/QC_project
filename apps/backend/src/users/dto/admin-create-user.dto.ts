import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum, IsInt } from 'class-validator';
import { Role, Specialization } from '@/auth/auth.types';


export class AdminCreateUserDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  isActive?: boolean;

  // NEW: Link to the laboratory section
  @IsOptional()
  @IsInt()
  sectionId?: number;

  // NEW: Professional focus for targeted alerts
  @IsOptional()
  @IsEnum(Specialization)
  specialization?: Specialization;
}
