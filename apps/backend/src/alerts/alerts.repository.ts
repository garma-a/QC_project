import { Injectable } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { DatabaseService } from '@/database/database.service';
import { alerts, usersToAlerts } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class AlertsRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async findAll() {
    return await this.databaseService.db.select().from(alerts);
  }

  async create(createAlertDto: typeof alerts.$inferInsert) {
    const [alert] = await this.databaseService.db.insert(alerts).values(createAlertDto).returning();
    return alert;
  }

  async markSeen(alertId: number, userId: number,) {
    return this.databaseService.db
      .update(usersToAlerts)
      .set({
        status: "SEEN",
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

  async markResolved(alertId: number, userId: number, resolutionNote?: string,) {

    return this.databaseService.db
      .update(usersToAlerts)
      .set({
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || null,
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
