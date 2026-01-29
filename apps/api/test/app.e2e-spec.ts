import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API e2e', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ dni: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.accessToken;

    const memberLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ dni: '12345678', password: 'demo123' });
    memberToken = memberLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('login returns access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ dni: 'admin', password: 'admin123' })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
  });

  it('GET /me returns member profile', async () => {
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(response.body.dni).toBe('12345678');
  });

  it('GET /admin/members returns list', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /service-requests creates request', async () => {
    const servicesResponse = await request(app.getHttpServer())
      .get('/services')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const services = servicesResponse.body.data || [];
    expect(services.length).toBeGreaterThan(0);

    const response = await request(app.getHttpServer())
      .post('/service-requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ serviceId: services[0].id, notes: 'Solicitud de prueba' })
      .expect(200);

    expect(response.body.id).toBeDefined();
  });
});
