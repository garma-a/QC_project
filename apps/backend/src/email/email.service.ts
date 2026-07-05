import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private isDevMode = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST', '');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');
    const devMode = this.configService.get<string>('SMTP_DEV_MODE', 'false');

    const useDevMode =
      devMode === 'true' || (!host && process.env.NODE_ENV !== 'production');

    if (useDevMode) {
      // ─── Ethereal "catch-all" SMTP for local development ────────────────
      // Automatically creates a free test inbox — no sign-up needed.
      // Every sent email will be printed as a preview URL in the console.
      this.isDevMode = true;
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log('📧  EMAIL DEV MODE  →  Ethereal catch-all inbox');
        this.logger.log(`    User : ${testAccount.user}`);
        this.logger.log(`    Pass : ${testAccount.pass}`);
        this.logger.log('    OTP preview links will appear here per email.');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } catch (err) {
        this.logger.warn(
          `Could not create Ethereal test account (${err.message}). ` +
            'Emails will be silently dropped in dev mode.',
        );
        // Fallback: no-op transporter
        this.transporter = nodemailer.createTransport({ jsonTransport: true });
      }
    } else {
      // ─── Real SMTP (Mailhog, Gmail, etc.) ───────────────────────────────
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
      });
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const from = this.configService.get<string>(
        'SMTP_FROM',
        'QC System <noreply@myghc-lab.local>',
      );

      const info = await this.transporter.sendMail({ from, to, subject, html });

      if (this.isDevMode) {
        // Print the Ethereal preview URL so the developer can open the email
        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(`📬  Email sent to ${to}`);
        this.logger.log(`    Subject : ${subject}`);
        if (previewUrl) {
          this.logger.log(`    Preview : ${previewUrl}`);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
