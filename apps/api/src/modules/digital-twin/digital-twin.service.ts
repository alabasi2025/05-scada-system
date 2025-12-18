import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DigitalTwinService {
  constructor(private prisma: PrismaService) {}

  // Network Nodes
  async findAllNodes(params: { stationId?: string; nodeType?: string; status?: string }) {
    const { stationId, nodeType, status } = params;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (nodeType) where.nodeType = nodeType;
    if (status) where.status = status;

    return this.prisma.network_nodes.findMany({ where, include: { components: true }, orderBy: { nodeCode: 'asc' } });
  }

  async findNodeById(id: string) {
    return this.prisma.network_nodes.findUnique({ where: { id }, include: { components: true, segmentsFrom: true, segmentsTo: true } });
  }

  async createNode(data: any) {
    return this.prisma.network_nodes.create({ data });
  }

  async updateNode(id: string, data: any) {
    return this.prisma.network_nodes.update({ where: { id }, data });
  }

  async deleteNode(id: string) {
    return this.prisma.network_nodes.delete({ where: { id } });
  }

  // Network Segments
  async findAllSegments(params: { stationId?: string; voltageLevel?: string }) {
    const { stationId, voltageLevel } = params;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (voltageLevel) where.voltageLevel = voltageLevel;

    return this.prisma.network_segments.findMany({ where, include: { fromNode: true, toNode: true }, orderBy: { segmentCode: 'asc' } });
  }

  async createSegment(data: any) {
    return this.prisma.network_segments.create({ data });
  }

  async updateSegment(id: string, data: any) {
    return this.prisma.network_segments.update({ where: { id }, data });
  }

  async deleteSegment(id: string) {
    return this.prisma.network_segments.delete({ where: { id } });
  }

  // Node Components
  async addComponent(nodeId: string, data: any) {
    return this.prisma.node_components.create({ data: { ...data, nodeId } });
  }

  async updateComponent(id: string, data: any) {
    return this.prisma.node_components.update({ where: { id }, data });
  }

  async deleteComponent(id: string) {
    return this.prisma.node_components.delete({ where: { id } });
  }

  // Geo Locations
  async findAllLocations(params: { entityType?: string }) {
    const { entityType } = params;
    const where: any = {};
    if (entityType) where.entityType = entityType;

    return this.prisma.geo_locations.findMany({ where, orderBy: { recordedAt: 'desc' } });
  }

  async createLocation(data: any) {
    return this.prisma.geo_locations.create({ data });
  }

  async updateLocation(id: string, data: any) {
    return this.prisma.geo_locations.update({ where: { id }, data });
  }

  // Network Statistics
  async getNetworkStats() {
    const [nodesCount, segmentsCount, nodesByType, segmentsByVoltage] = await Promise.all([
      this.prisma.network_nodes.count(),
      this.prisma.network_segments.count(),
      this.prisma.network_nodes.groupBy({ by: ['nodeType'], _count: true }),
      this.prisma.network_segments.groupBy({ by: ['voltageLevel'], _count: true }),
    ]);

    return { nodesCount, segmentsCount, nodesByType, segmentsByVoltage };
  }
}
