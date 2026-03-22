import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { alerts, usersToAlerts } from '@/drizzle/schema';
import { and, desc, eq } from 'drizzle-orm';

@Injectable()
export class AlertsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAllByUser(userId: number) {
    return await this.databaseService.db
      .select({
        id: alerts.id,
        type: alerts.type,
        priority: alerts.priority,
        message: alerts.message,
        ruleViolated: alerts.ruleViolated,
        suggestedSolution: alerts.suggestedSolution,
        resultId: alerts.resultId,
        createdAt: alerts.createdAt,
        status: usersToAlerts.status,
        seenAt: usersToAlerts.seenAt,
        resolvedAt: usersToAlerts.resolvedAt,
        resolutionNote: usersToAlerts.resolutionNote,
      })
      .from(usersToAlerts)
      .innerJoin(alerts, eq(usersToAlerts.alertId, alerts.id))
      .where(eq(usersToAlerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }

  async create(createAlertDto: typeof alerts.$inferInsert) {
    const [alert] = await this.databaseService.db
      .insert(alerts)
      .values(createAlertDto)
      .returning();
    return alert;
  }

  async createForUser(
    createAlertDto: typeof alerts.$inferInsert,
    userId: number,
  ) {
    return await this.databaseService.db.transaction(async (tx) => {
      const [alert] = await tx
        .insert(alerts)
        .values(createAlertDto)
        .returning();

      await tx.insert(usersToAlerts).values({
        userId,
        alertId: alert.id,
      });

      return alert;
    });
  }

  async createForUsers(
    createAlertDto: typeof alerts.$inferInsert,
    userIds: number[],
  ) {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      return await this.create(createAlertDto);
    }

    return await this.databaseService.db.transaction(async (tx) => {
      const [alert] = await tx
        .insert(alerts)
        .values(createAlertDto)
        .returning();

      await tx.insert(usersToAlerts).values(
        uniqueUserIds.map((id) => ({
          userId: id,
          alertId: alert.id,
        })),
      );

      return alert;
    });
  }

  async markSeen(alertId: number, userId: number) {
    return this.databaseService.db
      .update(usersToAlerts)
      .set({
        status: 'SEEN',
        seenAt: new Date(),
      })
      .where(
        and(
          eq(usersToAlerts.alertId, alertId),
          eq(usersToAlerts.userId, userId),
        ),
      )
      .returning();
  }

  async markResolved(alertId: number, userId: number, resolutionNote?: string) {
    return this.databaseService.db
      .update(usersToAlerts)
      .set({
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNote: resolutionNote ?? null,
      })
      .where(
        and(
          eq(usersToAlerts.alertId, alertId),
          eq(usersToAlerts.userId, userId),
        ),
      )
      .returning();
  }
}
