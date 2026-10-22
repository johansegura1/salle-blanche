import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, type Fixtures, login, resetDb, slot, workingDay } from './helpers.js';

/** Fonctionnalité 3 : les équipements par zone, et leur maintenance. */
describe('Équipements et maintenance', () => {
  let app: INestApplication;
  let f: Fixtures;
  let lea: string;
  let claire: string;
  const day = workingDay(1);

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
    [lea, claire] = [await login(app, 'lea'), await login(app, 'claire')];
  });
  beforeEach(async () => {
    f = await resetDb(app);
  });
  afterAll(() => app.close());

  it('refuse la liste sans token (401)', async () => {
    await request(app.getHttpServer()).get('/equipments').expect(401);
  });

  it('liste les équipements, avec leur statut et l’habilitation de l’utilisateur', async () => {
    const response = await request(app.getHttpServer()).get('/equipments').set('Authorization', `Bearer ${lea}`).expect(200);
    expect(response.body).toEqual([
      expect.objectContaining({ code: 'SB-010', zone: 'FABRICATION', status: 'AVAILABLE', habilitated: true }),
      expect.objectContaining({ code: 'SB-020', zone: 'LITHOGRAPHIE', status: 'AVAILABLE', habilitated: false }),
    ]);
  });

  it('filtre par zone, et refuse une zone inconnue (400)', async () => {
    const response = await request(app.getHttpServer())
      .get('/equipments?zone=LITHOGRAPHIE')
      .set('Authorization', `Bearer ${lea}`)
      .expect(200);
    expect(response.body.map((e: { code: string }) => e.code)).toEqual(['SB-020']);
    await request(app.getHttpServer()).get('/equipments?zone=CUISINE').set('Authorization', `Bearer ${lea}`).expect(400);
  });

  it('un équipement en maintenance en ce moment a le statut MAINTENANCE', async () => {
    const now = Date.now();
    await request(app.getHttpServer())
      .post(`/equipments/${f.aligneur}/maintenances`)
      .set('Authorization', `Bearer ${claire}`)
      .send({ start: new Date(now - 3600_000).toISOString(), end: new Date(now + 3600_000).toISOString(), reason: 'Lampe UV' })
      .expect(201);
    const response = await request(app.getHttpServer())
      .get(`/equipments/${f.aligneur}`)
      .set('Authorization', `Bearer ${lea}`)
      .expect(200);
    expect(response.body.status).toBe('MAINTENANCE');
    expect(response.body.maintenances[0].reason).toBe('Lampe UV');
  });

  it('mettre en maintenance est réservé aux gestionnaires (403)', async () => {
    await request(app.getHttpServer())
      .post(`/equipments/${f.four}/maintenances`)
      .set('Authorization', `Bearer ${lea}`)
      .send({ ...slot(day, [7, 0], [20, 0]), reason: 'Panne' })
      .expect(403);
  });

  it('annule les réservations de la période, avec la raison, et seulement celles-là', async () => {
    const reserve = (from: [number, number], to: [number, number], other = day) =>
      request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${lea}`)
        .send({ equipmentId: f.four, ...slot(other, from, to) })
        .expect(201);
    await reserve([8, 0], [10, 0]);
    await reserve([10, 0], [12, 0]);
    await reserve([8, 0], [9, 0], workingDay(day === workingDay(2) ? 3 : 2)); // un autre jour

    const response = await request(app.getHttpServer())
      .post(`/equipments/${f.four}/maintenances`)
      .set('Authorization', `Bearer ${claire}`)
      .send({ ...slot(day, [9, 0], [11, 0]), reason: 'Changement de thermocouple' })
      .expect(201);
    expect(response.body.cancelledReservations).toBe(2);

    const mine = await request(app.getHttpServer()).get('/reservations/mine').set('Authorization', `Bearer ${lea}`).expect(200);
    const cancelled = mine.body.filter((r: { status: string }) => r.status === 'CANCELLED');
    expect(cancelled).toHaveLength(2);
    expect(cancelled[0].cancelReason).toBe('Maintenance : Changement de thermocouple');
  });

  it('refuse une maintenance dont la fin est avant le début (400)', async () => {
    await request(app.getHttpServer())
      .post(`/equipments/${f.four}/maintenances`)
      .set('Authorization', `Bearer ${claire}`)
      .send({ ...slot(day, [11, 0], [9, 0]), reason: 'Erreur' })
      .expect(400);
  });

  it('un gestionnaire peut retirer une maintenance', async () => {
    const created = await request(app.getHttpServer())
      .post(`/equipments/${f.four}/maintenances`)
      .set('Authorization', `Bearer ${claire}`)
      .send({ ...slot(day, [7, 0], [20, 0]), reason: 'Erreur de saisie' })
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/maintenances/${created.body.maintenance.id}`)
      .set('Authorization', `Bearer ${claire}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/maintenances/${created.body.maintenance.id}`)
      .set('Authorization', `Bearer ${claire}`)
      .expect(404);
  });
});
