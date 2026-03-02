import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminCreateUserDto, UserRole } from './dto/admin-create-user.dto';
import { users , sections} from '../drizzle/schema'; 
import * as argon2 from 'argon2';
import { DatabaseService } from '../database/database.service';
import { eq } from 'drizzle-orm';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';

@Injectable()
export class UsersService {
    constructor(private databaseService: DatabaseService) {}

   async createUser(adminCreateUserDto: AdminCreateUserDto){
        const hashedPassword = await argon2.hash(adminCreateUserDto.password);

        if (adminCreateUserDto.sectionId) {
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
      role: adminCreateUserDto.role ?? 'INTERN',
      isActive: adminCreateUserDto.isActive ?? true,
      sectionId: adminCreateUserDto.sectionId,
      specialization: adminCreateUserDto.specialization,
    })
    .returning();
    const { passwordHash, ...safeUser } = createdUser;
    return safeUser;

}

    async deactivateUser(id: number) {
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
    if (adminUpdateUserDto.sectionId) {
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

async getUsers(roleFilter?: UserRole) {
  if (roleFilter && !Object.values(UserRole).includes(roleFilter)) {
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
      sectionName: sections.name, // To display 'Hematology' on the doctor's card
    })
    .from(users)
    .leftJoin(sections, eq(users.sectionId, sections.id));

  // If you only want to show 'ENGINEER' or 'INTERN' on this page
  if (roleFilter) {
    return await query.where(eq(users.role, roleFilter));
  }

  return await query;
}

}
