import { Test, TestingModule } from '@nestjs/testing';
import { StationsService } from './stations.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('StationsService', () => {
  let service: StationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    scada_stations: {
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
        StationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StationsService>(StationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of stations', async () => {
      const mockStations = [
        { id: '1', code: 'STN-001', name: 'محطة 1', type: 'main', status: 'online' },
        { id: '2', code: 'STN-002', name: 'محطة 2', type: 'substation', status: 'online' },
      ];

      mockPrismaService.scada_stations.findMany.mockResolvedValue(mockStations);

      const result = await service.findAll();

      expect(result).toEqual(mockStations);
      expect(mockPrismaService.scada_stations.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no stations exist', async () => {
      mockPrismaService.scada_stations.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a station by id', async () => {
      const mockStation = { id: '1', code: 'STN-001', name: 'محطة 1', type: 'main' };

      mockPrismaService.scada_stations.findUnique.mockResolvedValue(mockStation);

      const result = await service.findOne('1');

      expect(result).toEqual(mockStation);
      expect(mockPrismaService.scada_stations.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should return null when station not found', async () => {
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new station', async () => {
      const createDto = { code: 'STN-003', name: 'محطة جديدة', type: 'distribution' };
      const mockCreatedStation = { id: '3', ...createDto, status: 'online', isActive: true };

      mockPrismaService.scada_stations.create.mockResolvedValue(mockCreatedStation);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedStation);
      expect(mockPrismaService.scada_stations.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('update', () => {
    it('should update a station', async () => {
      const updateDto = { name: 'محطة محدثة' };
      const mockUpdatedStation = { id: '1', code: 'STN-001', name: 'محطة محدثة', type: 'main' };

      mockPrismaService.scada_stations.update.mockResolvedValue(mockUpdatedStation);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(mockUpdatedStation);
      expect(mockPrismaService.scada_stations.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a station', async () => {
      const mockDeletedStation = { id: '1', code: 'STN-001', name: 'محطة 1' };

      mockPrismaService.scada_stations.delete.mockResolvedValue(mockDeletedStation);

      const result = await service.remove('1');

      expect(result).toEqual(mockDeletedStation);
      expect(mockPrismaService.scada_stations.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getStatistics', () => {
    it('should return station statistics', async () => {
      mockPrismaService.scada_stations.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // online
        .mockResolvedValueOnce(1)  // offline
        .mockResolvedValueOnce(1); // maintenance

      const result = await service.getStatistics();

      expect(result).toEqual({
        total: 10,
        online: 8,
        offline: 1,
        maintenance: 1,
      });
    });
  });
});
