import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, login, resetDb } from './helpers.js';

/** Les équipements par zone, avec leur statut et l'habilitation de l'utilisateur. */
describe('Équipements et maintenance', () => {
  let app: INestApplication;
  let lea: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
    lea = await login(app, 'lea');
  });
  beforeEach(async () => {
    await resetDb(app);
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
});
