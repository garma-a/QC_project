import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './http-exception.filter.js';

import { ValidationPipe } from '@nestjs/common';
import { writeFileSync } from 'fs';


async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  // do not forget to add the origin of the frontend application
  app.enableCors();
  app.setGlobalPrefix('api/v1');

  const httpAdapter = app.get(HttpAdapterHost);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('QC-Project API')
    .setDescription('The Full documnetation to the QC-Project API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  //writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  SwaggerModule.setup('api/v1/docs', app, document);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
