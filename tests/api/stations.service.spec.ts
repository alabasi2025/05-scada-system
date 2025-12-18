import { Test, TestingModule } from '@nestjs/testing';
import { StationsService } from './stations.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('StationsService', () => {
  let service: StationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    scada_stations: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockStation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    code: 'STN-001',
    name: 'محطة الرياض الرئيسية',
    nameEn: 'Riyadh Main Station',
    type: 'main',
    voltageLevel: 'HV',
    capacity: '500',
    status: 'online',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StationsService>(StationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      code: 'STN-001',
      name: 'محطة الرياض الرئيسية',
      nameEn: 'Riyadh Main Station',
      type: 'main',
      voltageLevel: 'HV',
      capacity: 500,
    };

    it('should create a new station successfully', async () => {
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(null);
      mockPrismaService.scada_stations.create.mockResolvedValue(mockStation);

      const result = await service.create(createDto);

      expect(result).toEqual(mockStation);
      expect(mockPrismaService.scada_stations.findUnique).toHaveBeenCalledWith({
        where: { code: createDto.code },
      });
      expect(mockPrismaService.scada_stations.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if station code already exists', async () => {
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(mockStation);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated stations list', async () => {
      const mockStations = [mockStation];
      mockPrismaService.scada_stations.findMany.mockResolvedValue(mockStations);
      mockPrismaService.scada_stations.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockStations);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by type', async () => {
      mockPrismaService.scada_stations.findMany.mockResolvedValue([mockStation]);
      mockPrismaService.scada_stations.count.mockResolvedValue(1);

      await service.findAll({ type: 'main', page: 1, limit: 10 });

      expect(mockPrismaService.scada_stations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'main' }),
        })
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.scada_stations.findMany.mockResolvedValue([mockStation]);
      mockPrismaService.scada_stations.count.mockResolvedValue(1);

      await service.findAll({ status: 'online', page: 1, limit: 10 });

      expect(mockPrismaService.scada_stations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'online' }),
        })
      );
    });

    it('should search by name', async () => {
      mockPrismaService.scada_stations.findMany.mockResolvedValue([mockStation]);
      mockPrismaService.scada_stations.count.mockResolvedValue(1);

      await service.findAll({ search: 'الرياض', page: 1, limit: 10 });

      expect(mockPrismaService.scada_stations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
            ]),
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a station by id', async () => {
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(mockStation);

      const result = await service.findOne(mockStation.id);

      expect(result).toEqual(mockStation);
    });

    it('should throw NotFoundException if station not found', async () => {
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'محطة الرياض المحدثة' };

    it('should update a station successfully', async () => {
      const updatedStation = { ...mockStation, ...updateDto };
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(mockStation);
      mockPrismaService.scada_stations.update.mockResolvedValue(updatedStation);

      const result = await service.update(mockStation.id, updateDto);

      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException if station not found', async () => {
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a station successfully', async () => {
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(mockStation);
      mockPrismaService.scada_stations.delete.mockResolvedValue(mockStation);

      const result = await service.remove(mockStation.id);

      expect(result).toEqual(mockStation);
    });

    it('should throw NotFoundException if station not found', async () => {
      mockPrismaService.scada_stations.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return station statistics', async () => {
      mockPrismaService.scada_stations.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // online
        .mockResolvedValueOnce(1)  // offline
        .mockResolvedValueOnce(1); // maintenance

      const result = await service.getStats();

      expect(result.total).toBe(10);
      expect(result.online).toBe(8);
      expect(result.offline).toBe(1);
      expect(result.maintenance).toBe(1);
    });
  });
});
