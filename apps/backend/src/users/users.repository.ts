import { Role } from '@/auth/auth.types';
import { DatabaseService } from '@/database/database.service';
import { sections, users } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';

@Injectable()
export class UsersRepository {
  constructor(private databaseService: DatabaseService) { }

  async findSectionById(id: number) {
    const [section] = await this.databaseService.db
      .select()
      .from(sections)
      .where(eq(sections.id, id));
    return section;
  }

  async findByEmail(email: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async findById(id: number) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async findEmailCollision(email: string, id: number) {
    const [collision] = await this.databaseService.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, id)));
    return collision;
  }

  async create(data: typeof users.$inferInsert) {
    const [createdUser] = await this.databaseService.db
      .insert(users)
      .values(data)
      .returning();
    return createdUser;
  }

  async update(id: number, data: Partial<typeof users.$inferInsert>) {
    const [updatedUser] = await this.databaseService.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deactivate(id: number) {
    const [user] = await this.databaseService.db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async activate(id: number) {
    const [user] = await this.databaseService.db
      .update(users)
      .set({ isActive: true })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async findAllWithSections(roleFilter?: Role) {
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

}
