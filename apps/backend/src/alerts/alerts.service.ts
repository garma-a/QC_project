import { Subject } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';
import { AlertsRepository } from './alerts.repository';
import { alerts } from '@/drizzle/schema';
import { EmailNotificationService } from '@/email/email-notification.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  public readonly alertEvents$ = new Subject<any>();

  constructor(
    private readonly alertsRepository: AlertsRepository,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  private async triggerEmailNotification(alertId: number) {
    try {
      const context = await this.alertsRepository.getAlertContext(alertId);
      if (context) {
        await this.emailNotificationService.sendAlertNotification({
          alertId: context.alertId,
          sectionId: context.sectionId,
          priority: context.priority || 'MEDIUM',
          machineName: context.machineName,
          testName: context.testName,
          sectionName: context.sectionName,
          measuredValue: context.measuredValue,
          zScore: context.zScore,
          ruleViolated: context.ruleViolated || 'Unknown',
          suggestedSolution: context.suggestedSolution || '',
          message: context.message || 'A QC deviation was detected.',
        });
      }
    } catch (error) {
      this.logger.error(`Failed to trigger email notification for alert ${alertId}: ${error.message}`);
    }
  }

  async createForUser(
    createAlertDto: typeof alerts.$inferInsert,
    userId: number,
  ) {
    const alert = await this.alertsRepository.createForUser(createAlertDto, userId);
    this.alertEvents$.next({ type: 'new-alert', alert, userId });
    this.triggerEmailNotification(alert.id);
    return alert;
  }

  async createForUsers(
    createAlertDto: typeof alerts.$inferInsert,
    userIds: number[],
  ) {
    const newAlert = await this.alertsRepository.createForUsers(createAlertDto, userIds);
    this.alertEvents$.next({ type: 'new-alerts', alerts: newAlert, userIds });
    this.triggerEmailNotification(newAlert.id);
    return newAlert;
  }

  async findAllByUser(userId: number, limit?: number, offset?: number, status?: string, timeRange?: string) {
    return await this.alertsRepository.findAllByUser(userId, limit, offset, status, timeRange);
  }

  async findAll(userId: number, limit?: number, offset?: number, sectionId?: number, machineId?: number, status?: string, timeRange?: string) {
    const alerts = await this.alertsRepository.findAll(userId, limit, offset, sectionId, machineId, status, timeRange);
    return alerts.map(alert => ({
      ...alert,
      status: alert.status ?? 'UNSEEN',
    }));
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
  async markUnseen(alertId: number, userId: number) {
    const result = await this.alertsRepository.markUnseen(alertId, userId);
    this.alertEvents$.next({ type: 'alert-unseen', alertId, userId });
    return result;
  }

  async markUnresolved(alertId: number, userId: number) {
    const result = await this.alertsRepository.markUnresolved(alertId, userId);
    this.alertEvents$.next({ type: 'alert-unresolved', alertId, userId });
    return result;
  }
}
