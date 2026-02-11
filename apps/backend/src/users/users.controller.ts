import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';


@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService){}

  
    @Post()
       async createUser(@Body() adminCreateUserDto: AdminCreateUserDto){
                return await this.userService.createUser(adminCreateUserDto);

        }
}
