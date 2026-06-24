import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  Get,
} from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { AdminCreateUserDto } from '@/users/dto/admin-create-user.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { AdminUpdateUserDto } from '@/users/dto/admin-update-user.dto';
import type { UpdateProfileDto, ProfileResponseDto } from '@qc/shared';
import { CurrentUser } from '@/users/user.decorator';
import { Role } from '@/auth/auth.types';
import {
  ApiQuery,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  UserResponseDto,
  UserListItemDto,
  DeactivateUserResponseDto,
} from '@/users/dto/user-response.dto';
import {
  ValidationErrorResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ConflictResponseDto,
} from '@/common/dto/error-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new user (admin only)',
    description:
      'Creates a new user account. Only administrators can create users. The password is hashed before storage. If no role is specified, defaults to TECHNICIAN. Users can be assigned to zero or more lab sections via `sectionIds`.',
  })
  @ApiBody({ type: AdminCreateUserDto })
  @ApiResponse({
    status: 201,
    description:
      'User created successfully. Returns the user without the password hash.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or the specified section does not exist.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can create users.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'A user with this email already exists.',
    type: ConflictResponseDto,
  })
  async createUser(@Body() adminCreateUserDto: AdminCreateUserDto) {
    return await this.userService.createUser(adminCreateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Deactivate a user by ID (admin only)',
    description:
      'Soft-deletes a user by setting `isActive` to false. Administrators cannot deactivate their own account. The user record is preserved for audit purposes.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The unique ID of the user to deactivate',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully.',
    type: DeactivateUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot deactivate your own administrator account.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can deactivate users.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    type: NotFoundResponseDto,
  })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.userService.deactivateUser(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update a user by ID (admin only)',
    description:
      'Updates one or more fields of an existing user. All fields are optional. Email uniqueness is enforced. Section existence is validated when `sectionIds` is provided.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The unique ID of the user to update',
    example: 2,
  })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiResponse({
    status: 200,
    description:
      'User updated successfully. Returns the updated user without the password hash.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or the specified section does not exist.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can update users.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email is already in use by another user.',
    type: ConflictResponseDto,
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ) {
    return this.userService.updateUser(id, adminUpdateUserDto);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the full details of the currently logged in user, including their assigned sections and email preferences.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile data retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  async getProfile(@CurrentUser('userId') userId: number) {
    return this.userService.getProfile(userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates profile fields and email preferences for the currently logged in user.',
  })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  async updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all users (admin only)',
    description:
      'Returns a list of all users with their assigned section IDs and names. Optionally filter by role. The password hash is never included in the response.',
  })
  @ApiQuery({
    name: 'role',
    enum: Role,
    enumName: 'Role',
    required: false,
    description: 'Filter users by role (ADMIN or TECHNICIAN)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users with joined section names.',
    type: [UserListItemDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid role filter value.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can list users.',
    type: ForbiddenResponseDto,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Limit the number of results returned (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Number of results to skip (default: 0)',
  })
  async getUsers(
    @Query('role') role?: Role,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.userService.getUsers(role, limit, offset);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID (admin only)',
    description:
      'Returns the full details of a single user. The password hash is excluded from the response.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The unique ID of the user',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User found. Returns user data without the password hash.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can view user details.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    type: NotFoundResponseDto,
  })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }
}
