import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/backend/src/app.module';
import { QcTestsService } from './apps/backend/src/qc-tests/qc-tests.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(QcTestsService);
  const tests = await service.getAll(100000, 0);
  console.log('Total tests fetched:', tests.length);
  
  const m22 = tests.filter(t => t.machineId === 22);
  console.log('Tests for machine 22:', m22.length);
  
  await app.close();
}
bootstrap();
