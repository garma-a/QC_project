  import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum, IsInt, IsBoolean } from 'class-validator';
  import { Role } from '@/auth/auth.types';
  import { ApiProperty } from '@nestjs/swagger';

  export class AdminCreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @MinLength(8)
    password: string;

    // FIX: Added the 'role' property name below the decorator
    @ApiProperty({ 
      enum: Role, 
      enumName: 'UserRole',
      type: () => String 
    })
    @IsOptional()
    @IsEnum(Role)
    role?: Role; // <--- This line was missing in your code!

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    sectionId?: number;
  }