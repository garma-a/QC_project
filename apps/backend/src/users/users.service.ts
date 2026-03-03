import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminCreateUserDto } from '@/users/dto/admin-create-user.dto';
import { users, sections } from '@/drizzle/schema';
import * as argon2 from 'argon2';
import { DatabaseService } from '@/database/database.service';
import { eq, and, ne } from 'drizzle-orm';
import { AdminUpdateUserDto } from '@/users/dto/admin-update-user-dto';
import { Role } from '@/auth/auth.types';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) { }

  async createUser(adminCreateUserDto: AdminCreateUserDto) {
    const hashedPassword = await argon2.hash(adminCreateUserDto.password);

    if (adminCreateUserDto.sectionId !== undefined) {
      const [sectionExists] = await this.databaseService.db
        .select()
        .from(sections)
        .where(eq(sections.id, adminCreateUserDto.sectionId));

      if (!sectionExists) {
        throw new BadRequestException(`Laboratory section with ID ${adminCreateUserDto.sectionId} does not exist.`);
      }
    }

    const existing = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, adminCreateUserDto.email));

    if (existing.length > 0) {
      throw new ConflictException('Email already exists');
    }

    const [createdUser] = await this.databaseService.db
      .insert(users)
      .values({
        firstName: adminCreateUserDto.firstName,
        lastName: adminCreateUserDto.lastName,
        email: adminCreateUserDto.email,
        passwordHash: hashedPassword,
        role: adminCreateUserDto.role ?? 'TECHNICIAN',
        isActive: adminCreateUserDto.isActive ?? true,
        sectionId: adminCreateUserDto.sectionId,
      })
      .returning();
    const { passwordHash, ...safeUser } = createdUser;
    return safeUser;

  }

  async deactivateUser(id: number, currentAdminId: number) {
    if (id === currentAdminId) {
      throw new BadRequestException("You cannot deactivate your own administrator account.");
    }
    const [user] = await this.databaseService.db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deactivated successfully' };
  }

  async updateUser(id: number, adminUpdateUserDto: AdminUpdateUserDto) {
    const [existingUser] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    if (adminUpdateUserDto.email) {
      const [emailCollision] = await this.databaseService.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, adminUpdateUserDto.email),
            ne(users.id, id)
          )
        );

      if (emailCollision) {
        throw new ConflictException(`Email ${adminUpdateUserDto.email} is already in use by another staff member.`);
      }
    }
    if (adminUpdateUserDto.sectionId !== undefined) {
      const [sectionExists] = await this.databaseService.db
        .select()
        .from(sections)
        .where(eq(sections.id, adminUpdateUserDto.sectionId));

      if (!sectionExists) {
        throw new BadRequestException(
          `Cannot move user. Laboratory section with ID ${adminUpdateUserDto.sectionId} does not exist.`
        );
      }
    }

    const [updatedUser] = await this.databaseService.db
      .update(users)
      .set(adminUpdateUserDto)
      .where(eq(users.id, id))
      .returning();


    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }
  // apps/backend/src/users/users.service.ts

  async getUsers(roleFilter?: Role) {
    if (roleFilter && !Object.values(Role).includes(roleFilter)) {
      throw new BadRequestException(`"${roleFilter}" is not a valid user role.`);
    }
    const query = this.databaseService.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        sectionName: sections.name,
      })
      .from(users)
      .leftJoin(sections, eq(users.sectionId, sections.id));

    if (roleFilter) {
      return await query.where(eq(users.role, roleFilter));
    }

    return await query;
  }
  // apps/backend/src/users/users.service.ts

  async getUserById(id: number) {

    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id));


    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }


    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }

}
