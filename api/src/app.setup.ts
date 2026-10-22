import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * La configuration commune à main.ts et aux tests : la même validation
 * partout, sinon les tests vérifient une API qui n'est pas celle qui tourne.
 * `whitelist` retire les champs non déclarés dans le DTO, `forbidNonWhitelisted`
 * refuse carrément la requête : impossible de glisser un userId dans le corps.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
}
