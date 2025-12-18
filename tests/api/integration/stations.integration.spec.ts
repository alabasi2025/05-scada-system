import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../apps/api/src/app/app.module';

describe('Stations API Integration Tests', () => {
  let app: INestApplication;
  let createdStationId: string;

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

  describe('GET /api/v1/stations', () => {
    it('should return an array of stations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/stations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter stations by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/stations?status=online')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((station: any) => {
        expect(station.status).toBe('online');
      });
    });
  });

  describe('POST /api/v1/stations', () => {
    it('should create a new station', async () => {
      const newStation = {
        code: `TEST-${Date.now()}`,
        name: 'محطة اختبار',
        type: 'distribution',
        voltageLevel: 'MV',
        latitude: 24.7136,
        longitude: 46.6753,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/stations')
        .send(newStation)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.code).toBe(newStation.code);
      createdStationId = response.body.id;
    });

    it('should fail with invalid data', async () => {
      const invalidStation = {
        // missing required fields
        name: 'محطة بدون كود',
      };

      await request(app.getHttpServer())
        .post('/api/v1/stations')
        .send(invalidStation)
        .expect(400);
    });
  });

  describe('GET /api/v1/stations/:id', () => {
    it('should return a single station', async () => {
      if (!createdStationId) return;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/stations/${createdStationId}`)
        .expect(200);

      expect(response.body.id).toBe(createdStationId);
    });

    it('should return 404 for non-existent station', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/stations/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/v1/stations/:id', () => {
    it('should update a station', async () => {
      if (!createdStationId) return;

      const updateData = {
        name: 'محطة اختبار محدثة',
        status: 'maintenance',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/stations/${createdStationId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/v1/stations/:id', () => {
    it('should delete a station', async () => {
      if (!createdStationId) return;

      await request(app.getHttpServer())
        .delete(`/api/v1/stations/${createdStationId}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/v1/stations/${createdStationId}`)
        .expect(404);
    });
  });
});
