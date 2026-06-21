import { Subject } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { AlertsRepository } from './alerts.repository';
import { alerts } from '@/drizzle/schema';

@Injectable()
export class AlertsService {
  public readonly alertEvents$ = new Subject<any>();

  constructor(private readonly alertsRepository: AlertsRepository) {}

  async createForUser(
    createAlertDto: typeof alerts.$inferInsert,
    userId: number,
  ) {
    const alert = await this.alertsRepository.createForUser(createAlertDto, userId);
    this.alertEvents$.next({ type: 'new-alert', alert, userId });
    return alert;
  }

  async createForUsers(
    createAlertDto: typeof alerts.$inferInsert,
    userIds: number[],
  ) {
    const newAlerts = await this.alertsRepository.createForUsers(createAlertDto, userIds);
    this.alertEvents$.next({ type: 'new-alerts', alerts: newAlerts, userIds });
    return newAlerts;
  }

  async findAllByUser(userId: number, limit?: number, offset?: number) {
    return await this.alertsRepository.findAllByUser(userId, limit, offset);
  }

  async markSeen(alertId: number, userId: number) {
    const result = await this.alertsRepository.markSeen(alertId, userId);
    this.alertEvents$.next({ type: 'alert-seen', alertId, userId });
    return result;
  }

  async markResolved(alertId: number, userId: number, resolutionNote?: string) {
    const result = await this.alertsRepository.markResolved(
      alertId,
      userId,
      resolutionNote,
    );
    this.alertEvents$.next({ type: 'alert-resolved', alertId, userId, resolutionNote });
    return result;
  }
}
