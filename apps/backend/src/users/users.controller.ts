import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';


@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService){}

  
    @Post()
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('ADMIN')
       async createUser(@Body() adminCreateUserDto: AdminCreateUserDto){
                return await this.userService.createUser(adminCreateUserDto);

        }
}
