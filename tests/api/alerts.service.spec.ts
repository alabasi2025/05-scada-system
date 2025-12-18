import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    alerts: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of alerts', async () => {
      const mockAlerts = [
        { id: '1', alertCode: 'ALT-001', title: 'تنبيه 1', severity: 'warning', status: 'active' },
        { id: '2', alertCode: 'ALT-002', title: 'تنبيه 2', severity: 'critical', status: 'active' },
      ];

      mockPrismaService.alerts.findMany.mockResolvedValue(mockAlerts);

      const result = await service.findAll();

      expect(result).toEqual(mockAlerts);
      expect(mockPrismaService.alerts.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no alerts exist', async () => {
      mockPrismaService.alerts.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an alert by id', async () => {
      const mockAlert = { id: '1', alertCode: 'ALT-001', title: 'تنبيه 1', severity: 'warning' };

      mockPrismaService.alerts.findUnique.mockResolvedValue(mockAlert);

      const result = await service.findOne('1');

      expect(result).toEqual(mockAlert);
      expect(mockPrismaService.alerts.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should return null when alert not found', async () => {
      mockPrismaService.alerts.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new alert', async () => {
      const createDto = {
        alertCode: 'ALT-003',
        alertType: 'threshold',
        severity: 'critical',
        title: 'تنبيه جديد',
        message: 'رسالة التنبيه',
        stationId: 'station-1',
      };
      const mockCreatedAlert = { id: '3', ...createDto, status: 'active' };

      mockPrismaService.alerts.create.mockResolvedValue(mockCreatedAlert);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedAlert);
      expect(mockPrismaService.alerts.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('acknowledge', () => {
    it('should acknowledge an alert', async () => {
      const mockAcknowledgedAlert = {
        id: '1',
        alertCode: 'ALT-001',
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy: 'user-1',
      };

      mockPrismaService.alerts.update.mockResolvedValue(mockAcknowledgedAlert);

      const result = await service.acknowledge('1', 'user-1');

      expect(result.status).toBe('acknowledged');
      expect(mockPrismaService.alerts.update).toHaveBeenCalled();
    });
  });

  describe('resolve', () => {
    it('should resolve an alert', async () => {
      const mockResolvedAlert = {
        id: '1',
        alertCode: 'ALT-001',
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: 'user-1',
      };

      mockPrismaService.alerts.update.mockResolvedValue(mockResolvedAlert);

      const result = await service.resolve('1', 'user-1');

      expect(result.status).toBe('resolved');
      expect(mockPrismaService.alerts.update).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return alert statistics', async () => {
      mockPrismaService.alerts.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(50)  // active
        .mockResolvedValueOnce(30)  // acknowledged
        .mockResolvedValueOnce(20)  // resolved
        .mockResolvedValueOnce(10); // critical

      const result = await service.getStatistics();

      expect(result).toEqual({
        total: 100,
        active: 50,
        acknowledged: 30,
        resolved: 20,
        critical: 10,
      });
    });
  });
});
