import { Test, TestingModule } from '@nestjs/testing';
import { CommandsService } from './commands.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('CommandsService', () => {
  let service: CommandsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    control_commands: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommandsService>(CommandsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of commands', async () => {
      const mockCommands = [
        { id: '1', commandCode: 'CMD-001', commandType: 'switch', status: 'pending' },
        { id: '2', commandCode: 'CMD-002', commandType: 'setpoint', status: 'executed' },
      ];

      mockPrismaService.control_commands.findMany.mockResolvedValue(mockCommands);

      const result = await service.findAll();

      expect(result).toEqual(mockCommands);
      expect(mockPrismaService.control_commands.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a command by id', async () => {
      const mockCommand = { id: '1', commandCode: 'CMD-001', commandType: 'switch' };

      mockPrismaService.control_commands.findUnique.mockResolvedValue(mockCommand);

      const result = await service.findOne('1');

      expect(result).toEqual(mockCommand);
    });

    it('should return null when command not found', async () => {
      mockPrismaService.control_commands.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new command', async () => {
      const createDto = {
        commandCode: 'CMD-003',
        commandType: 'switch',
        stationId: 'station-1',
        requestedBy: 'user-1',
      };
      const mockCreatedCommand = { id: '3', ...createDto, status: 'pending' };

      mockPrismaService.control_commands.create.mockResolvedValue(mockCreatedCommand);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedCommand);
      expect(mockPrismaService.control_commands.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('execute', () => {
    it('should execute a command and update status', async () => {
      const mockExecutedCommand = {
        id: '1',
        commandCode: 'CMD-001',
        status: 'executed',
        executedAt: new Date(),
      };

      mockPrismaService.control_commands.update.mockResolvedValue(mockExecutedCommand);

      const result = await service.execute('1');

      expect(result.status).toBe('executed');
      expect(mockPrismaService.control_commands.update).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending command', async () => {
      const mockCancelledCommand = {
        id: '1',
        commandCode: 'CMD-001',
        status: 'cancelled',
      };

      mockPrismaService.control_commands.update.mockResolvedValue(mockCancelledCommand);

      const result = await service.cancel('1');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('getStatistics', () => {
    it('should return command statistics', async () => {
      mockPrismaService.control_commands.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20)  // pending
        .mockResolvedValueOnce(70)  // executed
        .mockResolvedValueOnce(5)   // failed
        .mockResolvedValueOnce(5);  // cancelled

      const result = await service.getStatistics();

      expect(result).toEqual({
        total: 100,
        pending: 20,
        executed: 70,
        failed: 5,
        cancelled: 5,
      });
    });
  });
});
