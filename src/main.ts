import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import passport from 'passport';
import { AppModule } from './app.module';
import { RateLimitService } from './services';
import { allowedHeaders, allowedOrigins } from './utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

   // Get rate limiting service from app context
  const rateLimitService = app.get(RateLimitService);

  // Enable CORS
  app.enableCors({
    origin: (origin: any, callback: any) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: allowedHeaders,
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Fatima Marketing APIs')
    .setDescription('Created by: asadali.dev512@gmail.com')
    .setVersion('1.25')
    .addTag('NestJs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document);

  // Initialize Passport
  app.use(passport.initialize());

  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Set global API prefix
  app.setGlobalPrefix('api/v1');
  
  // Apply specific limiters BEFORE global limiter
  app.use('/api/v1/auth/login', rateLimitService.authenticationLimiter());
  app.use('/api/v1/auth/register', rateLimitService.authenticationLimiter());
  app.use('/api/v1/auth/refresh', rateLimitService.refreshLimiter());

  // app.use(rateLimitService.globalLimiter());

  // Cookie parser and body parsers AFTER rate limiting
  app.use(cookieParser());
  app.use(json());
  app.use(urlencoded({ extended: true }));

  await app.listen(8080);
}

bootstrap();