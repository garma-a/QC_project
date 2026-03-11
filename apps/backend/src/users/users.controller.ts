import { Controller, Post, Body, UseGuards, Delete, Patch, Param, ParseIntPipe, Query, Get } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { AdminCreateUserDto } from '@/users/dto/admin-create-user.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { AdminUpdateUserDto } from '@/users/dto/admin-update-user-dto';
import { CurrentUser } from '@/users/user.decorator';
import { Role } from '@/auth/auth.types';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiBody({ type: AdminCreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createUser(@Body() adminCreateUserDto: AdminCreateUserDto) {
    return await this.userService.createUser(adminCreateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a user by ID (admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentUser("userId") userId: number) {
    return this.userService.deactivateUser(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a user by ID (admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() adminUpdateUserDto: AdminUpdateUserDto,) {
    return this.userService.updateUser(id, adminUpdateUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiQuery({ name: 'role', enum: Role, enumName: 'Role', required: false, description: 'Filter users by role' })
  @ApiResponse({ status: 200, description: 'List of users.' })
  async getUsers(@Query('role') role?: Role) {
    return this.userService.getUsers(role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }
}

