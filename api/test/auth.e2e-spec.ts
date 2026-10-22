import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, login, resetDb } from './helpers.js';

describe('/auth et /users', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
  });
  afterAll(() => app.close());

  it('GET /health répond 200 sans token', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('POST /auth/login renvoie un token pour claire / secret', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'claire', password: 'secret' })
      .expect(200);
    expect(response.body.access_token.split('.')).toHaveLength(3);
  });

  it('POST /auth/login répond 401 à un mauvais mot de passe, et à un compte inconnu', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({ username: 'claire', password: 'nope' }).expect(401);
    await request(app.getHttpServer()).post('/auth/login').send({ username: 'personne', password: 'secret' }).expect(401);
  });

  it('GET /auth/whoami répond 401 sans token, et avec un token falsifié', async () => {
    await request(app.getHttpServer()).get('/auth/whoami').expect(401);
    await request(app.getHttpServer()).get('/auth/whoami').set('Authorization', 'Bearer abc.def.ghi').expect(401);
  });

  it('GET /auth/whoami renvoie le nom et le rôle', async () => {
    const token = await login(app, 'lea');
    const response = await request(app.getHttpServer())
      .get('/auth/whoami')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(response.body).toMatchObject({ username: 'lea', name: 'Léa Dubois', role: 'user' });
  });

  it('GET /users est réservé aux gestionnaires, et ne renvoie jamais de hash de mot de passe', async () => {
    const [lea, claire] = [await login(app, 'lea'), await login(app, 'claire')];
    await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${lea}`).expect(403);
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${claire}`)
      .expect(200);
    expect(response.body).toHaveLength(3);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });
});
