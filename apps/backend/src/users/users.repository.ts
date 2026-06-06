import { Role } from '@/auth/auth.types';
import { DatabaseService } from '@/database/database.service';
import { sections, users, usersToSections } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { and, eq, inArray, ne, desc } from 'drizzle-orm';

@Injectable()
export class UsersRepository {
  constructor(private databaseService: DatabaseService) {}

  async findSectionsByIds(ids: number[]) {
    if (ids.length === 0) return [];

    return await this.databaseService.db
      .select()
      .from(sections)
      .where(inArray(sections.id, ids));
  }

  async findByEmail(email: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async findById(id: number) {
    return await this.findByIdWithSections(id);
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

  async assignSections(userId: number, sectionIds: number[]) {
    const uniqueSectionIds = [...new Set(sectionIds)];
    if (uniqueSectionIds.length === 0) return;

    await this.databaseService.db.insert(usersToSections).values(
      uniqueSectionIds.map((sectionId) => ({
        userId,
        sectionId,
      })),
    );
  }

  async replaceUserSections(userId: number, sectionIds: number[]) {
    const uniqueSectionIds = [...new Set(sectionIds)];

    await this.databaseService.db
      .delete(usersToSections)
      .where(eq(usersToSections.userId, userId));

    if (uniqueSectionIds.length === 0) return;

    await this.databaseService.db.insert(usersToSections).values(
      uniqueSectionIds.map((sectionId) => ({
        userId,
        sectionId,
      })),
    );
  }

  async getSectionIdsForUser(userId: number) {
    const assignments = await this.databaseService.db
      .select({ sectionId: usersToSections.sectionId })
      .from(usersToSections)
      .where(eq(usersToSections.userId, userId));

    return assignments.map((x) => x.sectionId);
  }

  async getUserIdsBySectionId(sectionId: number) {
    const rows = await this.databaseService.db
      .select({ userId: usersToSections.userId })
      .from(usersToSections)
      .where(eq(usersToSections.sectionId, sectionId));

    return rows.map((x) => x.userId);
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

  async findAllWithSections(roleFilter?: Role, limit: number = 50, offset: number = 0) {
    let query = this.databaseService.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .$dynamic();

    if (roleFilter) {
      query = query.where(eq(users.role, roleFilter));
    }

    const safeLimit = Math.min(limit || 50, 50);
    const safeOffset = offset || 0;
    const baseUsers = await query.orderBy(desc(users.id)).limit(safeLimit).offset(safeOffset);

    if (baseUsers.length === 0) return [];

    const userIds = baseUsers.map((u) => u.id);
    const sectionRows = await this.databaseService.db
      .select({
        userId: usersToSections.userId,
        sectionId: sections.id,
        sectionName: sections.name,
      })
      .from(usersToSections)
      .innerJoin(sections, eq(usersToSections.sectionId, sections.id))
      .where(inArray(usersToSections.userId, userIds));

    const sectionsByUserId = new Map<
      number,
      { sectionIds: number[]; sectionNames: string[] }
    >();
    for (const row of sectionRows) {
      const current = sectionsByUserId.get(row.userId) ?? {
        sectionIds: [],
        sectionNames: [],
      };
      current.sectionIds.push(row.sectionId);
      current.sectionNames.push(row.sectionName);
      sectionsByUserId.set(row.userId, current);
    }

    return baseUsers.map((u) => {
      const sectionsInfo = sectionsByUserId.get(u.id) ?? {
        sectionIds: [],
        sectionNames: [],
      };
      return {
        ...u,
        sectionIds: sectionsInfo.sectionIds,
        sectionNames: sectionsInfo.sectionNames,
      };
    });
  }

  async findByIdWithSections(id: number) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    if (!user) return null;

    const sectionRows = await this.databaseService.db
      .select({
        sectionId: sections.id,
        sectionName: sections.name,
      })
      .from(usersToSections)
      .innerJoin(sections, eq(usersToSections.sectionId, sections.id))
      .where(eq(usersToSections.userId, id));

    return {
      ...user,
      sectionIds: sectionRows.map((x) => x.sectionId),
      sectionNames: sectionRows.map((x) => x.sectionName),
    };
  }
}
