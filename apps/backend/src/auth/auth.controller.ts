import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
//import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from '@/auth/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
