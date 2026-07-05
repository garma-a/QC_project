import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { alerts, controlLots, qcResults, qcTests, usersToAlerts, machines, sections } from '@/drizzle/schema';
import { and, desc, eq, gte, or, isNull } from 'drizzle-orm';

@Injectable()
export class AlertsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAllByUser(userId: number, limit?: number, offset?: number, status?: string, timeRange?: string) {
    const conditions: any[] = [eq(usersToAlerts.userId, userId)];
    if (status) {
      conditions.push(eq(usersToAlerts.status, status as any));
    }
    if (timeRange) {
      const now = new Date();
      if (timeRange === '24h') {
        conditions.push(gte(alerts.createdAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));
      } else if (timeRange === '7d') {
        conditions.push(gte(alerts.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
      }
    }

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
        machineName: machines.name,
        sectionId: sections.id,
        sectionName: sections.name,
        testName: qcTests.testName,
      })
      .from(usersToAlerts)
      .innerJoin(alerts, eq(usersToAlerts.alertId, alerts.id))
      .innerJoin(qcResults, eq(alerts.resultId, qcResults.id))
      .innerJoin(controlLots, eq(qcResults.lotId, controlLots.id))
      .innerJoin(qcTests, eq(controlLots.testId, qcTests.id))
      .innerJoin(machines, eq(qcTests.machineId, machines.id))
      .innerJoin(sections, eq(machines.sectionId, sections.id))
      .where(and(...conditions))
      .orderBy(desc(alerts.createdAt))
      .$dynamic();

    const safeLimit = Math.max(1, Math.min(limit ?? 50, 500));
    const safeOffset = Math.max(0, offset ?? 0);

    query = query.limit(safeLimit).offset(safeOffset);

    return await query;
  }

  async findAll(userId: number, limit?: number, offset?: number, sectionId?: number, machineId?: number, status?: string, timeRange?: string) {
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
        // For unassigned alerts, status/seenAt/resolvedAt will be null, so we cast to UNSEEN in service if needed
        status: usersToAlerts.status,
        seenAt: usersToAlerts.seenAt,
        resolvedAt: usersToAlerts.resolvedAt,
        resolutionNote: usersToAlerts.resolutionNote,
        machineId: qcTests.machineId,
        testId: qcTests.id,
        machineName: machines.name,
        sectionId: sections.id,
        sectionName: sections.name,
        testName: qcTests.testName,
      })
      .from(alerts)
      .innerJoin(qcResults, eq(alerts.resultId, qcResults.id))
      .innerJoin(controlLots, eq(qcResults.lotId, controlLots.id))
      .innerJoin(qcTests, eq(controlLots.testId, qcTests.id))
      .innerJoin(machines, eq(qcTests.machineId, machines.id))
      .innerJoin(sections, eq(machines.sectionId, sections.id))
      .leftJoin(
        usersToAlerts,
        and(eq(alerts.id, usersToAlerts.alertId), eq(usersToAlerts.userId, userId)),
      )
      .orderBy(desc(alerts.createdAt))
      .$dynamic();

    const conditions: any[] = [];
    if (sectionId) conditions.push(eq(sections.id, sectionId));
    if (machineId) conditions.push(eq(machines.id, machineId));
    if (status) {
      if (status === 'UNSEEN') {
        conditions.push(or(isNull(usersToAlerts.status), eq(usersToAlerts.status, 'UNSEEN')));
      } else {
        conditions.push(eq(usersToAlerts.status, status as any));
      }
    }
    if (timeRange) {
      const now = new Date();
      if (timeRange === '24h') {
        conditions.push(gte(alerts.createdAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));
      } else if (timeRange === '7d') {
        conditions.push(gte(alerts.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const safeLimit = Math.max(1, Math.min(limit ?? 50, 500));
    const safeOffset = Math.max(0, offset ?? 0);

    query = query.limit(safeLimit).offset(safeOffset);

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
      .insert(usersToAlerts)
      .values({
        userId,
        alertId,
        status: 'SEEN',
        seenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [usersToAlerts.userId, usersToAlerts.alertId],
        set: {
          status: 'SEEN',
          seenAt: new Date(),
        },
      })
      .returning();
  }

  async markResolved(alertId: number, userId: number, resolutionNote?: string) {
    return this.databaseService.db
      .insert(usersToAlerts)
      .values({
        userId,
        alertId,
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNote: resolutionNote ?? null,
      })
      .onConflictDoUpdate({
        target: [usersToAlerts.userId, usersToAlerts.alertId],
        set: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNote: resolutionNote ?? null,
        },
      })
      .returning();
  }

  async markUnseen(alertId: number, userId: number) {
    return this.databaseService.db
      .insert(usersToAlerts)
      .values({
        userId,
        alertId,
        status: 'UNSEEN',
        seenAt: null,
      })
      .onConflictDoUpdate({
        target: [usersToAlerts.userId, usersToAlerts.alertId],
        set: {
          status: 'UNSEEN',
          seenAt: null,
        },
      })
      .returning();
  }

  async markUnresolved(alertId: number, userId: number) {
    return this.databaseService.db
      .insert(usersToAlerts)
      .values({
        userId,
        alertId,
        status: 'SEEN',
        resolvedAt: null,
        resolutionNote: null,
      })
      .onConflictDoUpdate({
        target: [usersToAlerts.userId, usersToAlerts.alertId],
        set: {
          status: 'SEEN',
          resolvedAt: null,
          resolutionNote: null,
        },
      })
      .returning();
  }

  async getAlertContext(alertId: number) {
    const [context] = await this.databaseService.db
      .select({
        alertId: alerts.id,
        priority: alerts.priority,
        message: alerts.message,
        ruleViolated: alerts.ruleViolated,
        suggestedSolution: alerts.suggestedSolution,
        measuredValue: qcResults.measuredValue,
        zScore: qcResults.zScore,
        testName: qcTests.testName,
        machineName: machines.name,
        sectionId: sections.id,
        sectionName: sections.name,
      })
      .from(alerts)
      .innerJoin(qcResults, eq(alerts.resultId, qcResults.id))
      .innerJoin(controlLots, eq(qcResults.lotId, controlLots.id))
      .innerJoin(qcTests, eq(controlLots.testId, qcTests.id))
      .innerJoin(machines, eq(qcTests.machineId, machines.id))
      .innerJoin(sections, eq(machines.sectionId, sections.id))
      .where(eq(alerts.id, alertId));

    return context;
  }
}
