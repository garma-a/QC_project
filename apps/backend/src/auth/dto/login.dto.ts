import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'strongPassword123',
    type: String,
    minLength: 6
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

