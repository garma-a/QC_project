import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService){}

  
    @Post('create')
       async createUser(@Body() adminCreateUserDto: AdminCreateUserDto){
                return await this.userService.createUser(adminCreateUserDto);

        }
}
