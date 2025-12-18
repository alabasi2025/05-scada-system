import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateConnectionDto,
  UpdateConnectionDto,
  ConnectionQueryDto,
  TestConnectionDto,
  ConnectionStatus,
  ConnectionProtocol,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateConnectionDto) {
    // التحقق من عدم وجود اتصال للمحطة
    const existing = await this.prisma.scadaConnection.findUnique({
      where: { stationId: dto.stationId },
    });

    if (existing) {
      throw new BadRequestException('يوجد اتصال مسبق لهذه المحطة');
    }

    // التحقق من وجود المحطة
    const station = await this.prisma.scadaStation.findUnique({
      where: { id: dto.stationId },
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    return this.prisma.scadaConnection.create({
      data: {
        stationId: dto.stationId,
        protocol: dto.protocol,
        ipAddress: dto.ipAddress,
        port: dto.port,
        slaveId: dto.slaveId,
        comPort: dto.comPort,
        baudRate: dto.baudRate,
        pollInterval: dto.pollInterval ?? 5,
        timeout: dto.timeout ?? 3000,
        isEnabled: dto.isEnabled ?? true,
        connectionStatus: ConnectionStatus.DISCONNECTED,
      },
      include: {
        station: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(query: ConnectionQueryDto) {
    const { protocol, connectionStatus, isEnabled } = query;

    const where: Prisma.ScadaConnectionWhereInput = {};

    if (protocol) where.protocol = protocol;
    if (connectionStatus) where.connectionStatus = connectionStatus;
    if (isEnabled !== undefined) where.isEnabled = isEnabled;

    const connections = await this.prisma.scadaConnection.findMany({
      where,
      include: {
        station: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: connections,
      meta: {
        total: connections.length,
      },
    };
  }

  async findByStationId(stationId: string) {
    const connection = await this.prisma.scadaConnection.findUnique({
      where: { stationId },
      include: {
        station: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            devices: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!connection) {
      throw new NotFoundException(`لا يوجد اتصال للمحطة: ${stationId}`);
    }

    return connection;
  }

  async update(stationId: string, dto: UpdateConnectionDto) {
    await this.findByStationId(stationId);

    return this.prisma.scadaConnection.update({
      where: { stationId },
      data: {
        protocol: dto.protocol,
        ipAddress: dto.ipAddress,
        port: dto.port,
        slaveId: dto.slaveId,
        comPort: dto.comPort,
        baudRate: dto.baudRate,
        pollInterval: dto.pollInterval,
        timeout: dto.timeout,
        isEnabled: dto.isEnabled,
      },
      include: {
        station: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(stationId: string) {
    await this.findByStationId(stationId);

    return this.prisma.scadaConnection.delete({
      where: { stationId },
    });
  }

  async testConnection(stationId: string, dto: TestConnectionDto) {
    const connection = await this.findByStationId(stationId);
    const startTime = Date.now();

    try {
      // محاكاة اختبار الاتصال
      // في الإنتاج، سيتم استخدام مكتبة Modbus الفعلية
      if (connection.protocol === ConnectionProtocol.MODBUS_TCP) {
        if (!connection.ipAddress || !connection.port) {
          throw new Error('عنوان IP والمنفذ مطلوبان لـ Modbus TCP');
        }

        // محاكاة الاتصال (سيتم استبداله بالكود الفعلي في المرحلة 2)
        await this.simulateModbusTcpTest(connection, dto);
      } else if (connection.protocol === ConnectionProtocol.MODBUS_RTU) {
        if (!connection.comPort) {
          throw new Error('منفذ COM مطلوب لـ Modbus RTU');
        }

        // محاكاة الاتصال
        await this.simulateModbusRtuTest(connection, dto);
      }

      const latency = Date.now() - startTime;

      // تحديث حالة الاتصال
      await this.prisma.scadaConnection.update({
        where: { stationId },
        data: {
          connectionStatus: ConnectionStatus.CONNECTED,
          lastConnectAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'تم الاتصال بنجاح',
        latency,
        data: [0, 0, 0], // بيانات تجريبية
      };
    } catch (error) {
      // تحديث حالة الاتصال
      await this.prisma.scadaConnection.update({
        where: { stationId },
        data: {
          connectionStatus: ConnectionStatus.ERROR,
        },
      });

      return {
        success: false,
        message: 'فشل الاتصال',
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  private async simulateModbusTcpTest(connection: any, dto: TestConnectionDto): Promise<void> {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // في الإنتاج، سيتم استخدام:
    // const client = new ModbusTcpClient(connection.ipAddress, connection.port);
    // await client.connect();
    // const data = await client.readHoldingRegisters(dto.testAddress || 0, dto.registerCount || 1);
    // await client.disconnect();
  }

  private async simulateModbusRtuTest(connection: any, dto: TestConnectionDto): Promise<void> {
    // محاكاة تأخير الاتصال التسلسلي
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  async updateStatus(stationId: string, status: ConnectionStatus) {
    return this.prisma.scadaConnection.update({
      where: { stationId },
      data: {
        connectionStatus: status,
        lastConnectAt: status === ConnectionStatus.CONNECTED ? new Date() : undefined,
      },
    });
  }

  async getEnabledConnections() {
    return this.prisma.scadaConnection.findMany({
      where: { isEnabled: true },
      include: {
        station: {
          include: {
            devices: {
              include: {
                dataPoints: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async getStatistics() {
    const [total, enabled, byProtocol, byStatus] = await Promise.all([
      this.prisma.scadaConnection.count(),
      this.prisma.scadaConnection.count({ where: { isEnabled: true } }),
      this.prisma.scadaConnection.groupBy({
        by: ['protocol'],
        _count: { id: true },
      }),
      this.prisma.scadaConnection.groupBy({
        by: ['connectionStatus'],
        _count: { id: true },
      }),
    ]);

    return {
      total,
      enabled,
      disabled: total - enabled,
      byProtocol: byProtocol.reduce((acc, item) => {
        acc[item.protocol] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.connectionStatus] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
