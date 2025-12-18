import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('DevicesService', () => {
  let service: DevicesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    scada_devices: {
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
        DevicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of devices', async () => {
      const mockDevices = [
        { id: '1', code: 'DEV-001', name: 'جهاز 1', type: 'meter', status: 'online' },
        { id: '2', code: 'DEV-002', name: 'جهاز 2', type: 'sensor', status: 'online' },
      ];

      mockPrismaService.scada_devices.findMany.mockResolvedValue(mockDevices);

      const result = await service.findAll();

      expect(result).toEqual(mockDevices);
      expect(mockPrismaService.scada_devices.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no devices exist', async () => {
      mockPrismaService.scada_devices.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a device by id', async () => {
      const mockDevice = { id: '1', code: 'DEV-001', name: 'جهاز 1', type: 'meter' };

      mockPrismaService.scada_devices.findUnique.mockResolvedValue(mockDevice);

      const result = await service.findOne('1');

      expect(result).toEqual(mockDevice);
      expect(mockPrismaService.scada_devices.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should return null when device not found', async () => {
      mockPrismaService.scada_devices.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new device', async () => {
      const createDto = { code: 'DEV-003', name: 'جهاز جديد', type: 'relay', stationId: '1', protocol: 'modbus' };
      const mockCreatedDevice = { id: '3', ...createDto, status: 'offline', isActive: true };

      mockPrismaService.scada_devices.create.mockResolvedValue(mockCreatedDevice);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedDevice);
      expect(mockPrismaService.scada_devices.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('update', () => {
    it('should update a device', async () => {
      const updateDto = { name: 'جهاز محدث', status: 'online' };
      const mockUpdatedDevice = { id: '1', code: 'DEV-001', name: 'جهاز محدث', status: 'online' };

      mockPrismaService.scada_devices.update.mockResolvedValue(mockUpdatedDevice);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(mockUpdatedDevice);
      expect(mockPrismaService.scada_devices.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a device', async () => {
      const mockDeletedDevice = { id: '1', code: 'DEV-001', name: 'جهاز 1' };

      mockPrismaService.scada_devices.delete.mockResolvedValue(mockDeletedDevice);

      const result = await service.remove('1');

      expect(result).toEqual(mockDeletedDevice);
      expect(mockPrismaService.scada_devices.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('findByStation', () => {
    it('should return devices for a specific station', async () => {
      const mockDevices = [
        { id: '1', code: 'DEV-001', name: 'جهاز 1', stationId: 'station-1' },
        { id: '2', code: 'DEV-002', name: 'جهاز 2', stationId: 'station-1' },
      ];

      mockPrismaService.scada_devices.findMany.mockResolvedValue(mockDevices);

      const result = await service.findByStation('station-1');

      expect(result).toEqual(mockDevices);
      expect(mockPrismaService.scada_devices.findMany).toHaveBeenCalledWith({
        where: { stationId: 'station-1' },
      });
    });
  });
});
