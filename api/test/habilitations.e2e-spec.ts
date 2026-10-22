import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, type Fixtures, login, resetDb, slot, workingDay } from './helpers.js';

/** Fonctionnalité 2 : les gestionnaires accordent et retirent les habilitations. */
describe('Habilitations', () => {
  let app: INestApplication;
  let f: Fixtures;
  let lea: string;
  let noah: string;
  let claire: string;
  const day = workingDay(1);

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
    [lea, noah, claire] = [await login(app, 'lea'), await login(app, 'noah'), await login(app, 'claire')];
  });
  beforeEach(async () => {
    f = await resetDb(app);
  });
  afterAll(() => app.close());

  const grant = (token: string, body: object) =>
    request(app.getHttpServer()).post('/habilitations').set('Authorization', `Bearer ${token}`).send(body);

  it('un gestionnaire habilite Noah, qui peut alors réserver', async () => {
    const reservation = { equipmentId: f.aligneur, ...slot(day, [8, 0], [9, 0]) };
    await request(app.getHttpServer()).post('/reservations').set('Authorization', `Bearer ${noah}`).send(reservation).expect(403);

    const response = await grant(claire, { userId: f.noah, equipmentId: f.aligneur }).expect(201);
    expect(response.body).toMatchObject({ grantedBy: 'claire', equipment: { code: 'SB-020' } });

    await request(app.getHttpServer()).post('/reservations').set('Authorization', `Bearer ${noah}`).send(reservation).expect(201);
  });

  it('un utilisateur ne peut pas s’habiliter lui-même (403)', async () => {
    await grant(noah, { userId: f.noah, equipmentId: f.aligneur }).expect(403);
  });

  it('refuse une habilitation qui existe déjà (409)', async () => {
    const response = await grant(claire, { userId: f.lea, equipmentId: f.four }).expect(409);
    expect(response.body.message).toContain('déjà habilité');
  });

  it('refuse un utilisateur ou un équipement inconnu (404)', async () => {
    await grant(claire, { userId: 'inconnu', equipmentId: f.four }).expect(404);
    await grant(claire, { userId: f.noah, equipmentId: 'inconnu' }).expect(404);
  });

  it('liste les habilitations d’une personne, et un retrait empêche de réserver', async () => {
    const list = await request(app.getHttpServer())
      .get('/habilitations')
      .query({ userId: f.lea })
      .set('Authorization', `Bearer ${claire}`)
      .expect(200);
    expect(list.body).toHaveLength(1);

    await request(app.getHttpServer())
      .delete(`/habilitations/${list.body[0].id}`)
      .set('Authorization', `Bearer ${claire}`)
      .expect(204);
    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${lea}`)
      .send({ equipmentId: f.four, ...slot(day, [8, 0], [9, 0]) })
      .expect(403);
  });

  it('la liste est réservée aux gestionnaires (403)', async () => {
    await request(app.getHttpServer()).get('/habilitations').query({ userId: f.lea }).set('Authorization', `Bearer ${lea}`).expect(403);
  });
});
