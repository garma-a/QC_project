import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminCreateUserDto } from '@/users/dto/admin-create-user.dto';
import { users, sections } from '@/drizzle/schema';
import * as argon2 from 'argon2';
import { DatabaseService } from '@/database/database.service';
import { eq, and, ne } from 'drizzle-orm';
import { AdminUpdateUserDto } from '@/users/dto/admin-update-user-dto';
import { Role } from '@/auth/auth.types';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersReposiotory: UsersRepository) { }

  async createUser(adminCreateUserDto: AdminCreateUserDto) {
    const hashedPassword = await argon2.hash(adminCreateUserDto.password);

    if (adminCreateUserDto.sectionId !== undefined) {
      const sectionExists = await this.usersReposiotory.findSectionById(adminCreateUserDto.sectionId);

      if (!sectionExists) {
        throw new BadRequestException(`Laboratory section with ID ${adminCreateUserDto.sectionId} does not exist.`);
      }
    }

    const existing = await this.usersReposiotory.findByEmail(adminCreateUserDto.email);

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const createdUser = await this.usersReposiotory.create({
      firstName: adminCreateUserDto.firstName,
      lastName: adminCreateUserDto.lastName,
      email: adminCreateUserDto.email,
      passwordHash: hashedPassword,
      role: adminCreateUserDto.role ?? 'TECHNICIAN',
      isActive: adminCreateUserDto.isActive ?? true,
      sectionId: adminCreateUserDto.sectionId,
    });

    const { passwordHash, ...safeUser } = createdUser;
    return safeUser;

  }

  async deactivateUser(id: number, currentAdminId: number) {
    if (id === currentAdminId) {
      throw new BadRequestException("You cannot deactivate your own administrator account.");
    }
    const user = await this.usersReposiotory.deactivate(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deactivated successfully' };
  }

  async updateUser(id: number, adminUpdateUserDto: AdminUpdateUserDto) {
    const existingUser = await this.usersReposiotory.findById(id);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    if (adminUpdateUserDto.email) {
      const emailCollision = await this.usersReposiotory.findEmailCollision(adminUpdateUserDto.email, id);

      if (emailCollision) {
        throw new ConflictException(`Email ${adminUpdateUserDto.email} is already in use by another staff member.`);
      }
    }
    if (adminUpdateUserDto.sectionId !== undefined) {
      const sectionExists = await this.usersReposiotory.findSectionById(adminUpdateUserDto.sectionId);
      if (!sectionExists) {
        throw new BadRequestException(
          `Cannot move user. Laboratory section with ID ${adminUpdateUserDto.sectionId} does not exist.`
        );
      }
    }

    const updatedUser = await this.usersReposiotory.update(id, adminUpdateUserDto);


    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  async getUsers(roleFilter?: Role) {
    if (roleFilter && !Object.values(Role).includes(roleFilter)) {
      throw new BadRequestException(`"${roleFilter}" is not a valid user role.`);
    }
    return await this.usersReposiotory.findAllWithSections(roleFilter);
  }

  async getUserById(id: number) {
    const user = await this.usersReposiotory.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }


    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }

}
