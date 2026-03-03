import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum, IsInt } from 'class-validator';

export enum UserRole {
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
}

export enum Specialization {
  HEMATOLOGY = 'HEMATOLOGY',
  CHEMISTRY = 'CHEMISTRY',
  MICROBIOLOGY = 'MICROBIOLOGY',
  IMMUNOLOGY = 'IMMUNOLOGY',
  OTHER = 'OTHER',
}

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
  @IsEnum(UserRole)
  role?: UserRole;

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
