import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MachinesModule } from '@/machines/machines.module';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { QcResultsModule } from '@/qc-results/qc-results.module';
import { ControlLotsModule } from '@/control-lots/control-lots.module';
import { QcTestsModule } from '@/qc-tests/qc-tests.module';
import { AlertsModule } from '@/alerts/alerts.module';
import { SectionsModule } from '@/sections/sections.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 5 * 60 * 1000,
      max: 1000,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MachinesModule,
    AuthModule,
    UsersModule,
    QcResultsModule,
    ControlLotsModule,
    QcTestsModule,
    AlertsModule,
    SectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
