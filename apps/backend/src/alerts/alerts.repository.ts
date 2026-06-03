import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { alerts, controlLots, qcResults, qcTests, usersToAlerts } from '@/drizzle/schema';
import { and, desc, eq } from 'drizzle-orm';

@Injectable()
export class AlertsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAllByUser(userId: number, limit?: number, offset?: number) {
    let query = this.databaseService.db
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
        machineId: qcTests.machineId,
        testId: qcTests.id,
      })
      .from(usersToAlerts)
      .innerJoin(alerts, eq(usersToAlerts.alertId, alerts.id))
      .innerJoin(qcResults, eq(alerts.resultId, qcResults.id))
      .innerJoin(controlLots, eq(qcResults.lotId, controlLots.id))
      .innerJoin(qcTests, eq(controlLots.testId, qcTests.id))
      .where(eq(usersToAlerts.userId, userId))
      .orderBy(desc(alerts.createdAt));

    if (limit !== undefined) {
      query = query.limit(limit) as any;
    }
    if (offset !== undefined) {
      query = query.offset(offset) as any;
    }

    return await query;
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
    const [alert] = await this.databaseService.db
      .insert(alerts)
      .values(createAlertDto)
      .returning();

    await this.databaseService.db.insert(usersToAlerts).values({
      userId,
      alertId: alert.id,
    });

    return alert;
  }

  async createForUsers(
    createAlertDto: typeof alerts.$inferInsert,
    userIds: number[],
  ) {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      return await this.create(createAlertDto);
    }

    const [alert] = await this.databaseService.db
      .insert(alerts)
      .values(createAlertDto)
      .returning();

    await this.databaseService.db.insert(usersToAlerts).values(
      uniqueUserIds.map((id) => ({
        userId: id,
        alertId: alert.id,
      })),
    );

    return alert;
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
