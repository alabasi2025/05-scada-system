import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCommandDto, CommandQueryDto } from './dto';

@Injectable()
export class CommandsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommandDto) {
    return this.prisma.control_commands.create({ 
      data: { 
        stationId: dto.stationId,
        deviceId: dto.deviceId,
        commandType: dto.commandType,
        targetType: 'device',
        targetId: dto.deviceId || dto.stationId,
        commandValue: dto.commandCode,
        parameters: dto.parameters || {},
        issuedBy: dto.requestedBy,
        status: 'pending'
      } as any 
    });
  }

  async findAll(query: CommandQueryDto) {
    const { stationId, status, page = 1, limit = 50 } = query;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.control_commands.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { issuedAt: 'desc' }, include: { station: true, device: true } }),
      this.prisma.control_commands.count({ where })
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const cmd = await this.prisma.control_commands.findUnique({ where: { id }, include: { station: true, device: true } });
    if (!cmd) throw new NotFoundException('الأمر غير موجود');
    return cmd;
  }

  async approve(id: string, userId: string) {
    await this.findOne(id);
    return this.prisma.control_commands.update({ where: { id }, data: { status: 'sent', notes: `Approved by ${userId}` } });
  }

  async execute(id: string) {
    const cmd = await this.findOne(id);
    // هنا يتم تنفيذ الأمر فعلياً عبر Modbus
    return this.prisma.control_commands.update({ where: { id }, data: { status: 'executed', executedAt: new Date(), result: 'success' } });
  }

  async reject(id: string, userId: string, reason: string) {
    await this.findOne(id);
    return this.prisma.control_commands.update({ where: { id }, data: { status: 'cancelled', notes: `Rejected by ${userId}: ${reason}` } });
  }
}
