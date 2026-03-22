import { Injectable } from '@nestjs/common';
import { AlertsRepository } from './alerts.repository';

@Injectable()
export class AlertsService {
  constructor(private readonly alertsRepository: AlertsRepository) {}

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
