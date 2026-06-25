import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailNotificationService } from './email-notification.service';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [EmailService, EmailNotificationService],
  exports: [EmailNotificationService, EmailService],
})
export class EmailModule {}

