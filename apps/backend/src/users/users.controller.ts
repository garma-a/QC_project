import { Controller, Post, Body, UseGuards, Delete, Patch, Param, ParseIntPipe, Query, Get } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { AdminCreateUserDto } from '@/users/dto/admin-create-user.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { AdminUpdateUserDto } from '@/users/dto/admin-update-user-dto';
import { CurrentUser } from '@/users/user.decorator';
import { Role } from '@/auth/auth.types';



@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createUser(@Body() adminCreateUserDto: AdminCreateUserDto) {
    return await this.userService.createUser(adminCreateUserDto);

  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentUser("userId", ParseIntPipe) userId: number) {
    return this.userService.deactivateUser(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')

  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() adminUpdateUserDto: AdminUpdateUserDto,) {
    return this.userService.updateUser(id, adminUpdateUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')

  async getUsers(@Query('role') role?: Role) {

    return this.userService.getUsers(role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }
}
