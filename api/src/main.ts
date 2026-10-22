import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  // Le navigateur ne laisse une page lire les réponses de l'API que si son
  // origine est listée ici. Une origine explicite, jamais '*'.
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' });

  // Swagger sur /docs : « Authorize » avec le token de POST /auth/login.
  const config = new DocumentBuilder()
    .setTitle('Salle blanche : API de réservation')
    .setDescription('Obtenez un token avec POST /auth/login, puis collez-le dans « Authorize ».')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
