import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MachinesModule } from './machines/machines.module';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,

    MachinesModule,

    AuthModule,


    UsersModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
