import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from './src/auth/auth.types';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jwtService = app.get(JwtService);
  const token = jwtService.sign({ sub: 1, email: 'admin@admin.com', role: Role.ADMIN });
  console.log("TOKEN=" + token);
  await app.close();
}
bootstrap();
