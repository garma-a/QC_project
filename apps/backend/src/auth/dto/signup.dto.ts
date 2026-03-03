import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignUpDto {

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'Password is too short. It must be at least 8 characters long',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
