import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
<<<<<<< HEAD
import { AllExceptionsFilter } from './http-exception.filter.js';
import { Logger } from '@nestjs/common';
=======
import { AllExceptionsFilter } from './http-exception.filter';
>>>>>>> c48db6c (add global error handler to main.ts)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  const httpAdapter = app.get(HttpAdapterHost);
  const config = new DocumentBuilder()
    .setTitle('QC-Project API')
    .setDescription('The Full documnetation to the QC-Project API')
    .setVersion('1.0')
    .addTag('users')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);
<<<<<<< HEAD
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
=======
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
>>>>>>> c48db6c (add global error handler to main.ts)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
