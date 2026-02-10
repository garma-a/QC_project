import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @Post('sign-up')
    signUp(@Body () signUpDto: SignUpDto){
        return this.authService.signUp();
    }
     @Post('login')
    login(@Body() loginUpDto: LoginDto){
        return this.authService.login();
    }
}
