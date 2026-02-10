import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import * as schema from "./drizzle/schema"
import { eq } from 'drizzle-orm';

@Injectable()
export class AppService {

  constructor(private readonly databaseService: DatabaseService) { }
  getHello(): string {
    return 'Hello World!';
  }
  async createTestUser() {

    const newUser = await this.databaseService.db.insert(schema.users).values({
      firstName: "garma",
      lastName: "test",
      email: "garma@gmail.com",
      passwordHash: "hashedpassword",
      phone: "1234567890",
      role: "INTERN",
    }).returning();


  return newUser;
}

  async deleteUserByEmail(email: string) {
    const deletedUser = await this.databaseService.db
      .delete(schema.users)
      .where(eq(schema.users.email, email))
      .returning();

    return deletedUser;
  }
}
