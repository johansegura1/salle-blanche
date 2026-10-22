import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/auth/password.js';
import { parisDate, parisTime } from '../src/common/paris-time.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/** L'application, configurée exactement comme dans main.ts (configureApp). */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

/** Les données connues de tous les tests. Le mot de passe est « secret » pour tout le monde. */
export interface Fixtures {
  claire: string; // id, gestionnaire
  lea: string; // id, habilitée sur le four
  noah: string; // id, habilité sur rien
  four: string; // id de SB-010, en FABRICATION
  aligneur: string; // id de SB-020, en LITHOGRAPHIE
}

/**
 * Vide la base et la remplit avec les mêmes données : chaque test part du même
 * état. Les ids sont fixes : un token obtenu avant un reset reste valable
 * (il porte l'id de l'utilisateur).
 */
export async function resetDb(app: INestApplication): Promise<Fixtures> {
  const prisma = app.get(PrismaService);
  await prisma.reservation.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.habilitation.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = hashPassword('secret');
  const claire = await prisma.user.create({ data: { id: 'user-claire', username: 'claire', name: 'Claire Martin', role: 'manager', passwordHash } });
  const lea = await prisma.user.create({ data: { id: 'user-lea', username: 'lea', name: 'Léa Dubois', role: 'user', passwordHash } });
  const noah = await prisma.user.create({ data: { id: 'user-noah', username: 'noah', name: 'Noah Bernard', role: 'user', passwordHash } });
  const four = await prisma.equipment.create({ data: { id: 'eq-four', code: 'SB-010', name: 'Four de recuit', zone: 'FABRICATION' } });
  const aligneur = await prisma.equipment.create({ data: { id: 'eq-aligneur', code: 'SB-020', name: 'Aligneur UV', zone: 'LITHOGRAPHIE' } });
  await prisma.habilitation.create({ data: { userId: lea.id, equipmentId: four.id, grantedBy: 'claire' } });

  return { claire: claire.id, lea: lea.id, noah: noah.id, four: four.id, aligneur: aligneur.id };
}

export async function login(app: INestApplication, username: string): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ username, password: 'secret' })
    .expect(200);
  return response.body.access_token as string;
}

/**
 * Un jour ouvré à venir, au format "2026-10-26", au moins `daysAhead` jours
 * après aujourd'hui. Les tests ne dépendent donc pas du jour où on les lance.
 */
export function workingDay(daysAhead = 1): string {
  for (let i = daysAhead; ; i++) {
    const { weekday, day } = parisTime(new Date(Date.now() + i * 24 * 60 * 60 * 1000));
    if (weekday >= 1 && weekday <= 5) return day;
  }
}

/** Un créneau ce jour-là, en heures de Paris, au format attendu par l'API. */
export function slot(day: string, from: [number, number], to: [number, number]) {
  return { start: parisDate(day, ...from).toISOString(), end: parisDate(day, ...to).toISOString() };
}
