import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('DevicesService', () => {
  let service: DevicesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    scada_devices: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockDevice = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    stationId: '123e4567-e89b-12d3-a456-426614174001',
    code: 'DEV-001',
    name: 'محول رئيسي',
    nameEn: 'Main Transformer',
    type: 'transformer',
    manufacturer: 'ABB',
    model: 'T-500',
    protocol: 'modbus_tcp',
    ipAddress: '192.168.1.100',
    port: 502,
    status: 'online',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      stationId: '123e4567-e89b-12d3-a456-426614174001',
      code: 'DEV-001',
      name: 'محول رئيسي',
      type: 'transformer',
      protocol: 'modbus_tcp',
    };

    it('should create a new device successfully', async () => {
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(null);
      mockPrismaService.scada_devices.create.mockResolvedValue(mockDevice);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDevice);
      expect(mockPrismaService.scada_devices.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if device code already exists', async () => {
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(mockDevice);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated devices list', async () => {
      const mockDevices = [mockDevice];
      mockPrismaService.scada_devices.findMany.mockResolvedValue(mockDevices);
      mockPrismaService.scada_devices.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockDevices);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by stationId', async () => {
      mockPrismaService.scada_devices.findMany.mockResolvedValue([mockDevice]);
      mockPrismaService.scada_devices.count.mockResolvedValue(1);

      await service.findAll({ stationId: mockDevice.stationId, page: 1, limit: 10 });

      expect(mockPrismaService.scada_devices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ stationId: mockDevice.stationId }),
        })
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.scada_devices.findMany.mockResolvedValue([mockDevice]);
      mockPrismaService.scada_devices.count.mockResolvedValue(1);

      await service.findAll({ type: 'transformer', page: 1, limit: 10 });

      expect(mockPrismaService.scada_devices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'transformer' }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a device by id', async () => {
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(mockDevice);

      const result = await service.findOne(mockDevice.id);

      expect(result).toEqual(mockDevice);
    });

    it('should throw NotFoundException if device not found', async () => {
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'محول محدث' };

    it('should update a device successfully', async () => {
      const updatedDevice = { ...mockDevice, ...updateDto };
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(mockDevice);
      mockPrismaService.scada_devices.update.mockResolvedValue(updatedDevice);

      const result = await service.update(mockDevice.id, updateDto);

      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException if device not found', async () => {
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a device successfully', async () => {
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(mockDevice);
      mockPrismaService.scada_devices.delete.mockResolvedValue(mockDevice);

      const result = await service.remove(mockDevice.id);

      expect(result).toEqual(mockDevice);
    });

    it('should throw NotFoundException if device not found', async () => {
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
