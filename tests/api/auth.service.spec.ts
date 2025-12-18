import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    scada_users: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        password: 'hashedPassword',
        email: 'admin@example.com',
        fullName: 'مدير النظام',
        role: 'admin',
      };

      mockPrismaService.scada_users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin', 'password123');

      expect(result).toEqual({
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        fullName: 'مدير النظام',
        role: 'admin',
      });
      expect(result.password).toBeUndefined();
    });

    it('should return null when user not found', async () => {
      mockPrismaService.scada_users.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        password: 'hashedPassword',
      };

      mockPrismaService.scada_users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('admin', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        password: 'hashedPassword',
        email: 'admin@example.com',
        fullName: 'مدير النظام',
        role: 'admin',
      };

      mockPrismaService.scada_users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({ username: 'admin', password: 'password123' });

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          fullName: 'مدير النظام',
          role: 'admin',
        },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockPrismaService.scada_users.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ username: 'invalid', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        email: 'newuser@example.com',
        fullName: 'مستخدم جديد',
      };

      mockPrismaService.scada_users.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrismaService.scada_users.create.mockResolvedValue({
        id: '2',
        ...registerDto,
        password: 'hashedPassword',
        role: 'viewer',
        isActive: true,
      });

      const result = await service.register(registerDto);

      expect(result.username).toBe('newuser');
      expect(result.password).toBeUndefined();
      expect(mockPrismaService.scada_users.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when username already exists', async () => {
      const registerDto = {
        username: 'existinguser',
        password: 'password123',
        email: 'new@example.com',
        fullName: 'مستخدم',
      };

      mockPrismaService.scada_users.findFirst.mockResolvedValue({ id: '1', username: 'existinguser' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        password: 'hashedPassword',
        email: 'admin@example.com',
        fullName: 'مدير النظام',
        role: 'admin',
      };

      mockPrismaService.scada_users.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('1');

      expect(result.username).toBe('admin');
      expect(result.password).toBeUndefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.scada_users.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
