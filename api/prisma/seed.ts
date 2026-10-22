/**
 * Remplit la base à partir de data/*.json : les comptes, les équipements, les
 * habilitations, et quelques réservations de démonstration.
 *
 * Il tourne à chaque `docker compose up` : il crée ce qui manque et ne touche
 * JAMAIS à ce qui existe (upsert avec `update: {}`). Une modification faite
 * dans l'application n'est donc pas écrasée au redémarrage. (Le seed du TP
 * écrasait les données : c'était un constat de l'audit de la séance 6.)
 *
 *   npm run db:seed
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { hashPassword } from '../src/auth/password.js';
import { parisDate, parisTime } from '../src/common/paris-time.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

interface UserSeed {
  username: string;
  name: string;
  role: 'manager' | 'user';
  password: string;
}
interface EquipmentSeed {
  code: string;
  name: string;
  zone: string;
}
interface HabilitationSeed {
  username: string;
  code: string;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

/** Le prochain jour ouvré, au moins `daysAhead` jours après aujourd'hui, au format "2026-10-26". */
function nextWorkingDay(daysAhead: number): string {
  for (let i = daysAhead; ; i++) {
    const { weekday, day } = parisTime(new Date(Date.now() + i * 24 * 60 * 60 * 1000));
    if (weekday >= 1 && weekday <= 5) return day;
  }
}

/*
 * Les comptes et les équipements du seed ont des id fixes ("user-lea",
 * "eq-SB-010") plutôt que des uuid tirés au hasard. Sinon, après un
 * `docker compose down -v`, le navigateur garde un token valide qui pointe
 * vers l'ancien id de Léa : elle se retrouve « non habilitée » partout et ses
 * réservations échouent. Avec des id fixes, un token reste juste d'une base à
 * l'autre, et les adresses du planning (/equipments/eq-SB-010) aussi.
 */
async function main(): Promise<void> {
  const users = await readJson<UserSeed[]>('data/users.json');
  for (const { password, ...user } of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      create: { id: `user-${user.username}`, ...user, passwordHash: hashPassword(password) },
      update: {},
    });
  }

  const equipments = await readJson<EquipmentSeed[]>('data/equipments.json');
  for (const equipment of equipments) {
    await prisma.equipment.upsert({
      where: { code: equipment.code },
      create: { id: `eq-${equipment.code}`, ...equipment },
      update: {},
    });
  }

  const habilitations = await readJson<HabilitationSeed[]>('data/habilitations.json');
  for (const { username, code } of habilitations) {
    const user = await prisma.user.findUniqueOrThrow({ where: { username } });
    const equipment = await prisma.equipment.findUniqueOrThrow({ where: { code } });
    await prisma.habilitation.upsert({
      where: { userId_equipmentId: { userId: user.id, equipmentId: equipment.id } },
      create: { userId: user.id, equipmentId: equipment.id, grantedBy: 'claire' },
      update: {},
    });
  }

  // Quelques réservations pour que le planning ne soit pas vide en démonstration :
  // seulement la première fois, quand il n'y en a encore aucune.
  if ((await prisma.reservation.count()) === 0) {
    const lea = await prisma.user.findUniqueOrThrow({ where: { username: 'lea' } });
    const claire = await prisma.user.findUniqueOrThrow({ where: { username: 'claire' } });
    const four = await prisma.equipment.findUniqueOrThrow({ where: { code: 'SB-010' } });
    const aligneur = await prisma.equipment.findUniqueOrThrow({ where: { code: 'SB-020' } });
    const day1 = nextWorkingDay(1);
    const day2 = nextWorkingDay(2);
    await prisma.reservation.createMany({
      data: [
        { userId: lea.id, equipmentId: four.id, start: parisDate(day1, 8), end: parisDate(day1, 12) },
        { userId: lea.id, equipmentId: aligneur.id, start: parisDate(day2, 14), end: parisDate(day2, 15, 30) },
        {
          userId: claire.id,
          equipmentId: four.id,
          start: parisDate(day2, 9),
          end: parisDate(day2, 17),
          note: "Pour l'entreprise Microsens",
        },
      ],
    });
  }

  console.log(`✅ ${users.length} comptes, ${equipments.length} équipements, ${habilitations.length} habilitations`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
