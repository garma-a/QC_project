import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MachinesModule } from '@/machines/machines.module';

import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { QcResultsModule } from './qc-results/qc-results.module';
import { QcTestsModule } from './qc-tests/qc-tests.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,

    MachinesModule,

    AuthModule,


    UsersModule,


    QcResultsModule,
    QcTestsModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
