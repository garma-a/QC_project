import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { EmailService } from './email.service';
import { alertEmailTemplate } from './email.templates';
import { emailLogs, users, usersToSections } from '@/drizzle/schema';
import { eq, or, and, inArray } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private readonly qcSystemUrl: string;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.qcSystemUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  async sendAlertNotification(data: {
    alertId: number;
    sectionId: number;
    priority: string;
    machineName: string;
    testName: string;
    sectionName: string;
    measuredValue: number;
    zScore: number;
    ruleViolated: string;
    suggestedSolution: string;
    message: string;
  }) {
    try {
      // 1. Find all active users with email notifications enabled
      // who are either subscribed to ALL sections, or subscribed to THIS specific section.
      
      const eligibleUsers = await this.databaseService.db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .leftJoin(usersToSections, eq(users.id, usersToSections.userId))
        .where(
          and(
            eq(users.isActive, true),
            eq(users.emailNotificationsEnabled, true),
            or(
              eq(users.subscribeToAllSections, true),
              eq(usersToSections.sectionId, data.sectionId)
            )
          )
        );

      // Deduplicate users (since left join could return multiple rows if a user has many sections and subscribeToAllSections is true)
      const uniqueUsers = Array.from(new Map(eligibleUsers.map(user => [user.id, user])).values());

      if (uniqueUsers.length === 0) {
        this.logger.log(`No eligible technicians found to notify for alert ${data.alertId}`);
        return;
      }

      this.logger.log(`Found ${uniqueUsers.length} technicians to notify for alert ${data.alertId}`);

      const html = alertEmailTemplate({
        ...data,
        qcSystemUrl: this.qcSystemUrl,
      });
      const subject = `[QC Alert] ${data.priority} Priority: ${data.ruleViolated} on ${data.machineName}`;

      // 2. Send emails to all eligible users and log them
      for (const user of uniqueUsers) {
        const success = await this.emailService.sendEmail(user.email, subject, html);
        
        await this.databaseService.db.insert(emailLogs).values({
          userId: user.id,
          recipientEmail: user.email,
          alertId: data.alertId,
          status: success ? 'SENT' : 'FAILED',
          errorMessage: success ? null : 'Failed to send via SMTP',
        });
      }
    } catch (error) {
      this.logger.error(`Error in sendAlertNotification: ${error.message}`, error.stack);
    }
  }
}
