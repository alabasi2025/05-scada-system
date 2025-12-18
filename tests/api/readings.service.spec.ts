import { Test, TestingModule } from '@nestjs/testing';
import { ReadingsService } from './readings.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('ReadingsService', () => {
  let service: ReadingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    live_readings: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    readings_history: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReadingsService>(ReadingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLiveReadings', () => {
    it('should return live readings for a station', async () => {
      const mockReadings = [
        { id: '1', pointId: 'point-1', value: 220.5, quality: 'good', timestamp: new Date() },
        { id: '2', pointId: 'point-2', value: 15.3, quality: 'good', timestamp: new Date() },
      ];

      mockPrismaService.live_readings.findMany.mockResolvedValue(mockReadings);

      const result = await service.getLiveReadings('station-1');

      expect(result).toEqual(mockReadings);
      expect(mockPrismaService.live_readings.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no readings exist', async () => {
      mockPrismaService.live_readings.findMany.mockResolvedValue([]);

      const result = await service.getLiveReadings('station-1');

      expect(result).toEqual([]);
    });
  });

  describe('createReading', () => {
    it('should create a new reading', async () => {
      const createDto = { pointId: 'point-1', value: 225.0, quality: 'good' };
      const mockCreatedReading = { id: '3', ...createDto, timestamp: new Date() };

      mockPrismaService.live_readings.upsert.mockResolvedValue(mockCreatedReading);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedReading);
    });
  });

  describe('getHistoricalReadings', () => {
    it('should return historical readings for a point', async () => {
      const mockHistory = [
        { id: '1', pointId: 'point-1', value: 220.0, timestamp: new Date('2025-12-17') },
        { id: '2', pointId: 'point-1', value: 221.5, timestamp: new Date('2025-12-18') },
      ];

      mockPrismaService.readings_history.findMany.mockResolvedValue(mockHistory);

      const result = await service.getHistory('point-1', new Date('2025-12-17'), new Date('2025-12-18'));

      expect(result).toEqual(mockHistory);
      expect(mockPrismaService.readings_history.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no historical data exists', async () => {
      mockPrismaService.readings_history.findMany.mockResolvedValue([]);

      const result = await service.getHistory('point-1', new Date('2025-12-17'), new Date('2025-12-18'));

      expect(result).toEqual([]);
    });
  });

  describe('validateReading', () => {
    it('should validate reading value within range', () => {
      const result = service.validateReading(220, 200, 240);
      expect(result).toBe(true);
    });

    it('should return false for out of range value', () => {
      const result = service.validateReading(250, 200, 240);
      expect(result).toBe(false);
    });
  });
});
