import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import passport from 'passport';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Enable Cross-Origin Resource Sharing (CORS)
  app.enableCors({
    origin: ['*'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Fatima Marketing APIs')
    .setDescription('Created by: asadali.dev512@gmail.com')
    .setVersion('1.15')
    .addTag('NestJs') // Optional: You can add tags here for grouping endpoints
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/', app, document);

  // Initialize Passport.js for authentication
  app.use(passport.initialize());

  // Apply global validation pipe for request validation
  app.useGlobalPipes(new ValidationPipe());

  // Set global API prefix for versioning (e.g., /api/v1)
  app.setGlobalPrefix('api/v1');

  // Enable raw body for webhook route
  app.use(
    '/api/v1/webhooks/sendgrid',
    express.raw({ type: 'application/json' }),
  );

  // ✅ CORRECT ORDER
  app.use(cookieParser()); // FIRST - Must parse cookies before anything else
  app.use(json()); // THEN - Parse JSON bodies
  app.use(urlencoded()); // THEN - Parse URL-encoded bodies

  // Start the application on port 8080
  await app.listen(8080);
}

bootstrap();
