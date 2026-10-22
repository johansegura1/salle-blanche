import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { DomainErrorFilter } from './common/domain-error.js';
import { EquipmentsModule } from './equipments/equipments.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { UsersModule } from './users/users.module.js';

/**
 * Le module racine. Un module absent d'ici n'existe pas pour Nest : ses
 * routes répondraient 404 sans un mot.
 * Le filtre des DomainError est déclaré ici (APP_FILTER) plutôt que dans
 * main.ts : ainsi les tests, qui démarrent AppModule, l'ont aussi.
 */
@Module({
  imports: [PrismaModule, AuthModule, UsersModule, EquipmentsModule, ReservationsModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule {}
