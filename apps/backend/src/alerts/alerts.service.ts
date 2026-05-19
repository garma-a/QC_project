import { Injectable } from '@nestjs/common';
import { AlertsRepository } from './alerts.repository';
import { alerts } from '@/drizzle/schema';

@Injectable()
export class AlertsService {
  constructor(private readonly alertsRepository: AlertsRepository) {}

  async createForUser(
    createAlertDto: typeof alerts.$inferInsert,
    userId: number,
  ) {
    return await this.alertsRepository.createForUser(createAlertDto, userId);
  }

  async createForUsers(
    createAlertDto: typeof alerts.$inferInsert,
    userIds: number[],
  ) {
    return await this.alertsRepository.createForUsers(createAlertDto, userIds);
  }

  async findAllByUser(userId: number) {
    return await this.alertsRepository.findAllByUser(userId);
  }

  async markSeen(alertId: number, userId: number) {
    return await this.alertsRepository.markSeen(alertId, userId);
  }

  async markResolved(alertId: number, userId: number, resolutionNote?: string) {
    return await this.alertsRepository.markResolved(
      alertId,
      userId,
      resolutionNote,
    );
  }
}
