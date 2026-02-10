import { Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @Post('sign-up')
    signUp(){
        return this.authService.signUp();
    }
     @Post('login')
    login(){
        return this.authService.login();
    }
}
