import { Module } from '@nestjs/common';
import { BffController } from './bff.controller';
import { BffService } from './bff.service';

@Module({
  controllers: [BffController],
  providers: [BffService]
})
export class BffModule {}
