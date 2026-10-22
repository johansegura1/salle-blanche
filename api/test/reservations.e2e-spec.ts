import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, type Fixtures, login, resetDb, slot, workingDay } from './helpers.js';

/** Fonctionnalité 1 : réserver un équipement, et libérer un créneau. */
describe('Réservations', () => {
  let app: INestApplication;
  let f: Fixtures;
  let lea: string;
  let noah: string;
  let claire: string;
  const day = workingDay(1);

  const reserve = (token: string, body: object) =>
    request(app.getHttpServer()).post('/reservations').set('Authorization', `Bearer ${token}`).send(body);

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
    [lea, noah, claire] = [await login(app, 'lea'), await login(app, 'noah'), await login(app, 'claire')];
  });
  beforeEach(async () => {
    f = await resetDb(app);
  });
  afterAll(() => app.close());

  it('refuse sans token (401)', async () => {
    await request(app.getHttpServer()).post('/reservations').send({ equipmentId: f.four, ...slot(day, [8, 0], [10, 0]) }).expect(401);
  });

  it('accepte un créneau libre pour une personne habilitée (201), à son nom', async () => {
    const response = await reserve(lea, { equipmentId: f.four, ...slot(day, [8, 0], [10, 0]) }).expect(201);
    expect(response.body).toMatchObject({ status: 'ACTIVE', user: { name: 'Léa Dubois' }, equipment: { code: 'SB-010' } });
  });

  it('refuse un créneau qui chevauche une réservation (409) : le premier arrivé a le créneau', async () => {
    await reserve(lea, { equipmentId: f.four, ...slot(day, [8, 0], [10, 0]) }).expect(201);
    const response = await reserve(claire, { equipmentId: f.four, ...slot(day, [9, 30], [11, 0]) }).expect(409);
    expect(response.body.message).toBe('Ce créneau est déjà réservé.');
  });

  it('accepte un créneau qui commence quand le précédent finit', async () => {
    await reserve(lea, { equipmentId: f.four, ...slot(day, [8, 0], [10, 0]) }).expect(201);
    await reserve(claire, { equipmentId: f.four, ...slot(day, [10, 0], [11, 0]) }).expect(201);
  });

  it('refuse une personne non habilitée (403), avec un message qui dit quoi faire', async () => {
    const response = await reserve(noah, { equipmentId: f.four, ...slot(day, [8, 0], [9, 0]) }).expect(403);
    expect(response.body.message).toContain('SB-010');
  });

  it('laisse un gestionnaire réserver sans habilitation, pour une entreprise', async () => {
    const response = await reserve(claire, {
      equipmentId: f.aligneur,
      note: "Pour l'entreprise Microsens",
      ...slot(day, [14, 0], [17, 0]),
    }).expect(201);
    expect(response.body.note).toBe("Pour l'entreprise Microsens");
  });

  it('refuse un créneau hors des horaires (400)', async () => {
    const response = await reserve(lea, { equipmentId: f.four, ...slot(day, [19, 0], [21, 0]) }).expect(400);
    expect(response.body.message).toContain('7 h à 20 h');
  });

  it('refuse un userId glissé dans le corps (400) : on réserve toujours à son nom', async () => {
    await reserve(noah, { equipmentId: f.four, userId: f.lea, ...slot(day, [8, 0], [9, 0]) }).expect(400);
  });

  it('refuse une date mal formée (400), et un équipement inconnu (404)', async () => {
    await reserve(lea, { equipmentId: f.four, start: 'demain', end: 'après-demain' }).expect(400);
    await reserve(lea, { equipmentId: 'inconnu', ...slot(day, [8, 0], [9, 0]) }).expect(404);
  });

  it('refuse un équipement en maintenance sur le créneau (409)', async () => {
    await request(app.getHttpServer())
      .post(`/equipments/${f.four}/maintenances`)
      .set('Authorization', `Bearer ${claire}`)
      .send({ ...slot(day, [7, 0], [20, 0]), reason: 'Pompe à vide' })
      .expect(201);
    const response = await reserve(lea, { equipmentId: f.four, ...slot(day, [8, 0], [9, 0]) }).expect(409);
    expect(response.body.message).toContain('maintenance');
  });

  it('montre le planning de la semaine à tout utilisateur connecté', async () => {
    await reserve(lea, { equipmentId: f.four, ...slot(day, [8, 0], [10, 0]) }).expect(201);
    const { start: from } = slot(day, [0, 0], [1, 0]);
    const to = new Date(new Date(from).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const response = await request(app.getHttpServer())
      .get(`/equipments/${f.four}/reservations`)
      .query({ from, to })
      .set('Authorization', `Bearer ${noah}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user.name).toBe('Léa Dubois');
  });

  describe('annuler', () => {
    let id: string;
    beforeEach(async () => {
      id = (await reserve(lea, { equipmentId: f.four, ...slot(day, [8, 0], [10, 0]) }).expect(201)).body.id;
    });

    it('son auteur peut l’annuler, et le créneau redevient libre', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/reservations/${id}`)
        .set('Authorization', `Bearer ${lea}`)
        .expect(200);
      expect(response.body.status).toBe('CANCELLED');
      await reserve(claire, { equipmentId: f.four, ...slot(day, [8, 0], [10, 0]) }).expect(201);
    });

    it('un autre utilisateur ne peut pas l’annuler (403)', async () => {
      await request(app.getHttpServer()).delete(`/reservations/${id}`).set('Authorization', `Bearer ${noah}`).expect(403);
    });

    it('un gestionnaire peut l’annuler, et son nom apparaît dans la raison', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/reservations/${id}`)
        .set('Authorization', `Bearer ${claire}`)
        .expect(200);
      expect(response.body.cancelReason).toBe('Annulée par Claire Martin');
    });

    it('on ne l’annule pas deux fois (409)', async () => {
      await request(app.getHttpServer()).delete(`/reservations/${id}`).set('Authorization', `Bearer ${lea}`).expect(200);
      await request(app.getHttpServer()).delete(`/reservations/${id}`).set('Authorization', `Bearer ${lea}`).expect(409);
    });

    it('GET /reservations/mine montre aussi les réservations annulées', async () => {
      await request(app.getHttpServer()).delete(`/reservations/${id}`).set('Authorization', `Bearer ${lea}`).expect(200);
      const response = await request(app.getHttpServer())
        .get('/reservations/mine')
        .set('Authorization', `Bearer ${lea}`)
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('CANCELLED');
    });
  });
});
