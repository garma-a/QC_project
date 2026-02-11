import { ConflictException, Injectable } from '@nestjs/common';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { users } from '../drizzle/schema'; 
import * as argon2 from 'argon2';
import { DatabaseService } from 'src/database/database.service';
import { eq } from 'drizzle-orm';

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
}
