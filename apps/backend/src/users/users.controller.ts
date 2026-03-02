import { Controller, Post, Body, UseGuards, Delete, Patch, Param, ParseIntPipe , Query,Get} from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminCreateUserDto, UserRole } from './dto/admin-create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';



@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService){}

  
    @Post()
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('ADMIN')
       async createUser(@Body() adminCreateUserDto: AdminCreateUserDto){
                return await this.userService.createUser(adminCreateUserDto);

        }

     @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
            return this.userService.deactivateUser(id);
        }

        @Patch(':id')
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('ADMIN')

        async updateUser( @Param('id', ParseIntPipe) id: number,@Body() adminUpdateUserDto: AdminUpdateUserDto, ) {
  return this.userService.updateUser(id, adminUpdateUserDto);
        }

        @Get()
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('ADMIN')

        async getUsers(@Query('role') role?: UserRole) {
    
    return this.userService.getUsers(role);
  }


       @Get(':id')
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('ADMIN')
        async getUserById(@Param('id', ParseIntPipe) id: number) {
        return this.userService.getUserById(id);
  } 
}
