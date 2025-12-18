import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    alerts: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAlert = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    alertCode: 'ALT-001',
    alertType: 'alarm',
    severity: 'high',
    title: 'ارتفاع درجة الحرارة',
    message: 'تجاوزت درجة الحرارة الحد المسموح',
    status: 'active',
    triggeredAt: new Date(),
    stationId: '123e4567-e89b-12d3-a456-426614174001',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      alertCode: 'ALT-001',
      alertType: 'alarm',
      severity: 'high',
      title: 'ارتفاع درجة الحرارة',
      message: 'تجاوزت درجة الحرارة الحد المسموح',
      stationId: '123e4567-e89b-12d3-a456-426614174001',
    };

    it('should create a new alert successfully', async () => {
      mockPrismaService.alerts.create.mockResolvedValue(mockAlert);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAlert);
      expect(mockPrismaService.alerts.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated alerts list', async () => {
      const mockAlerts = [mockAlert];
      mockPrismaService.alerts.findMany.mockResolvedValue(mockAlerts);
      mockPrismaService.alerts.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockAlerts);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by severity', async () => {
      mockPrismaService.alerts.findMany.mockResolvedValue([mockAlert]);
      mockPrismaService.alerts.count.mockResolvedValue(1);

      await service.findAll({ severity: 'high', page: 1, limit: 10 });

      expect(mockPrismaService.alerts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ severity: 'high' }),
        })
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.alerts.findMany.mockResolvedValue([mockAlert]);
      mockPrismaService.alerts.count.mockResolvedValue(1);

      await service.findAll({ status: 'active', page: 1, limit: 10 });

      expect(mockPrismaService.alerts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return an alert by id', async () => {
      mockPrismaService.alerts.findUnique.mockResolvedValue(mockAlert);

      const result = await service.findOne(mockAlert.id);

      expect(result).toEqual(mockAlert);
    });

    it('should throw NotFoundException if alert not found', async () => {
      mockPrismaService.alerts.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('acknowledge', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174002';

    it('should acknowledge an alert successfully', async () => {
      const acknowledgedAlert = {
        ...mockAlert,
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      };
      mockPrismaService.alerts.findUnique.mockResolvedValue(mockAlert);
      mockPrismaService.alerts.update.mockResolvedValue(acknowledgedAlert);

      const result = await service.acknowledge(mockAlert.id, userId);

      expect(result.status).toBe('acknowledged');
      expect(result.acknowledgedBy).toBe(userId);
    });

    it('should throw NotFoundException if alert not found', async () => {
      mockPrismaService.alerts.findUnique.mockResolvedValue(null);

      await expect(service.acknowledge('non-existent-id', userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolve', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174002';
    const notes = 'تم إصلاح المشكلة';

    it('should resolve an alert successfully', async () => {
      const resolvedAlert = {
        ...mockAlert,
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNotes: notes,
      };
      mockPrismaService.alerts.findUnique.mockResolvedValue(mockAlert);
      mockPrismaService.alerts.update.mockResolvedValue(resolvedAlert);

      const result = await service.resolve(mockAlert.id, userId, notes);

      expect(result.status).toBe('resolved');
      expect(result.resolvedBy).toBe(userId);
      expect(result.resolutionNotes).toBe(notes);
    });

    it('should throw NotFoundException if alert not found', async () => {
      mockPrismaService.alerts.findUnique.mockResolvedValue(null);

      await expect(service.resolve('non-existent-id', userId, notes)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return alert statistics', async () => {
      mockPrismaService.alerts.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // active
        .mockResolvedValueOnce(3)  // acknowledged
        .mockResolvedValueOnce(2)  // resolved
        .mockResolvedValueOnce(2); // critical

      const result = await service.getStats();

      expect(result.total).toBe(10);
      expect(result.active).toBe(5);
      expect(result.acknowledged).toBe(3);
      expect(result.resolved).toBe(2);
      expect(result.critical).toBe(2);
    });
  });
});
