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

  // Network Map - خريطة الشبكة الكاملة
  async getNetworkMap(stationId?: string) {
    const where: any = stationId ? { stationId } : {};

    const [stations, nodes, segments, locations] = await Promise.all([
      this.prisma.scada_stations.findMany({
        where: stationId ? { id: stationId } : { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          latitude: true,
          longitude: true,
          status: true,
          voltageLevel: true,
        }
      }),
      this.prisma.network_nodes.findMany({
        where,
        include: { components: true }
      }),
      this.prisma.network_segments.findMany({
        where,
        include: { fromNode: true, toNode: true }
      }),
      this.prisma.geo_locations.findMany({
        where: stationId ? { entityId: stationId } : {},
      })
    ]);

    // تحويل البيانات لصيغة GeoJSON
    const geoJson = {
      type: 'FeatureCollection',
      features: [
        // المحطات كنقاط
        ...stations.map(s => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [s.longitude?.toNumber() || 0, s.latitude?.toNumber() || 0]
          },
          properties: {
            id: s.id,
            code: s.code,
            name: s.name,
            type: s.type,
            status: s.status,
            entityType: 'station'
          }
        })),
        // العقد كنقاط
        ...nodes.map(n => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [n.longitude?.toNumber() || 0, n.latitude?.toNumber() || 0]
          },
          properties: {
            id: n.id,
            code: n.nodeCode,
            name: n.nodeName,
            type: n.nodeType,
            status: n.status,
            entityType: 'node'
          }
        })),
        // المقاطع كخطوط
        ...segments.map(s => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [s.fromNode?.longitude?.toNumber() || 0, s.fromNode?.latitude?.toNumber() || 0],
              [s.toNode?.longitude?.toNumber() || 0, s.toNode?.latitude?.toNumber() || 0]
            ]
          },
          properties: {
            id: s.id,
            code: s.segmentCode,
            cableType: s.cableType,
            voltageLevel: s.voltageLevel,
            length: s.lengthMeters?.toNumber() || 0,
            status: s.status,
            entityType: 'segment'
          }
        }))
      ]
    };

    return {
      geoJson,
      summary: {
        stationsCount: stations.length,
        nodesCount: nodes.length,
        segmentsCount: segments.length,
        totalCableLength: segments.reduce((acc, s) => acc + (s.lengthMeters?.toNumber() || 0), 0)
      }
    };
  }

  // تحليل هبوط الجهد
  async analyzeVoltageDrop(segmentId?: string) {
    const segments = segmentId 
      ? await this.prisma.network_segments.findMany({ where: { id: segmentId } })
      : await this.prisma.network_segments.findMany({ take: 100 });

    const analysis = segments.map(segment => {
      // حساب هبوط الجهد باستخدام المعادلة: Vd = I × R × L / 1000
      const length = segment.lengthMeters?.toNumber() || 0;
      const resistance = segment.resistancePerKm?.toNumber() || 0.5; // افتراضي
      const maxCurrent = segment.maxCurrentAmps?.toNumber() || 100;
      
      // حساب هبوط الجهد (تقريبي)
      const voltageDrop = (maxCurrent * resistance * length) / 1000;
      const voltageDropPercent = segment.voltageLevel === 'LV' ? (voltageDrop / 400) * 100 
        : segment.voltageLevel === 'MV' ? (voltageDrop / 11000) * 100 
        : (voltageDrop / 33000) * 100;

      return {
        segmentId: segment.id,
        segmentCode: segment.segmentCode,
        length,
        resistance,
        maxCurrent,
        voltageDrop: Math.round(voltageDrop * 100) / 100,
        voltageDropPercent: Math.round(voltageDropPercent * 1000) / 1000,
        status: voltageDropPercent > 5 ? 'critical' : voltageDropPercent > 3 ? 'warning' : 'normal',
        recommendation: voltageDropPercent > 5 
          ? 'يجب تقليل طول الكابل أو زيادة مقطعه'
          : voltageDropPercent > 3 
          ? 'مراقبة الحمل على هذا المقطع'
          : 'ضمن الحدود المقبولة'
      };
    });

    const criticalCount = analysis.filter(a => a.status === 'critical').length;
    const warningCount = analysis.filter(a => a.status === 'warning').length;

    return {
      analysis,
      summary: {
        totalSegments: analysis.length,
        critical: criticalCount,
        warning: warningCount,
        normal: analysis.length - criticalCount - warningCount,
        avgVoltageDrop: analysis.reduce((a, b) => a + b.voltageDropPercent, 0) / (analysis.length || 1)
      }
    };
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
