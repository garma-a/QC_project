import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ControlLotsService } from './src/control-lots/control-lots.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(ControlLotsService);
  try {
    const lots = await service.findAll();
    console.log("Success! Found lots:", lots.length);
  } catch (err) {
    console.error("Error calling findAll:", err);
  }
  await app.close();
}
bootstrap();
