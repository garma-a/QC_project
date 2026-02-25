import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { users } from '../drizzle/schema'; 
import * as argon2 from 'argon2';
import { DatabaseService } from 'src/database/database.service';
import { eq } from 'drizzle-orm';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';

@Injectable()
export class UsersService {
    constructor(private databaseService: DatabaseService) {}

   async createUser(adminCreateUserDto: AdminCreateUserDto){
        const hashedPassword = await argon2.hash(adminCreateUserDto.password);
            
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
  // 1. Check if user exists
  const [existingUser] = await this.databaseService.db
    .select()
    .from(users)
    .where(eq(users.id, id));

  if (!existingUser) {
    throw new NotFoundException('User not found');
  }

  // 2. Update the user
  // Drizzle's .set() automatically ignores 'undefined' values in the DTO
  const [updatedUser] = await this.databaseService.db
    .update(users)
    .set(adminUpdateUserDto) 
    .where(eq(users.id, id))
    .returning();

  return updatedUser;
}

}
