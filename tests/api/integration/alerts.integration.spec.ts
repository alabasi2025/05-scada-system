import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../apps/api/src/app/app.module';

describe('Alerts API Integration Tests', () => {
  let app: INestApplication;
  let createdAlertId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/alerts', () => {
    it('should return an array of alerts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/alerts')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter alerts by severity', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/alerts?severity=critical')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((alert: any) => {
        expect(alert.severity).toBe('critical');
      });
    });

    it('should filter alerts by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/alerts?status=active')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((alert: any) => {
        expect(alert.status).toBe('active');
      });
    });
  });

  describe('POST /api/v1/alerts', () => {
    it('should create a new alert', async () => {
      const newAlert = {
        alertCode: `ALT-${Date.now()}`,
        alertType: 'voltage',
        severity: 'warning',
        title: 'تنبيه اختبار',
        message: 'هذا تنبيه اختبار للتكامل',
        source: 'integration_test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/alerts')
        .send(newAlert)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.alertCode).toBe(newAlert.alertCode);
      createdAlertId = response.body.id;
    });
  });

  describe('PUT /api/v1/alerts/:id/acknowledge', () => {
    it('should acknowledge an alert', async () => {
      if (!createdAlertId) return;

      const response = await request(app.getHttpServer())
        .put(`/api/v1/alerts/${createdAlertId}/acknowledge`)
        .send({ acknowledgedBy: 'test_user' })
        .expect(200);

      expect(response.body.status).toBe('acknowledged');
      expect(response.body.acknowledgedBy).toBe('test_user');
    });
  });

  describe('PUT /api/v1/alerts/:id/resolve', () => {
    it('should resolve an alert', async () => {
      if (!createdAlertId) return;

      const response = await request(app.getHttpServer())
        .put(`/api/v1/alerts/${createdAlertId}/resolve`)
        .send({ resolvedBy: 'test_user', resolution: 'تم حل المشكلة' })
        .expect(200);

      expect(response.body.status).toBe('resolved');
    });
  });

  describe('GET /api/v1/alerts/stats', () => {
    it('should return alert statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/alerts/stats')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('bySeverity');
      expect(response.body).toHaveProperty('byStatus');
    });
  });
});
