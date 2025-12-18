import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';

const connectionString = process.env.DATABASE_URL || 'postgresql://scada_user:scada_pass@localhost:5432/scada_db';
console.log('Connecting to database...');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...');

  // إنشاء المحطات
  const stations = await Promise.all([
    prisma.scada_stations.create({
      data: {
        code: 'STN-001',
        name: 'محطة الرياض الرئيسية',
        nameEn: 'Riyadh Main Station',
        type: 'main',
        voltageLevel: 'HV',
        latitude: new Prisma.Decimal(24.7136),
        longitude: new Prisma.Decimal(46.6753),
        address: 'الرياض، حي العليا',
        capacity: new Prisma.Decimal(500),
        status: 'online',
      }
    }),
    prisma.scada_stations.create({
      data: {
        code: 'STN-002',
        name: 'محطة جدة الفرعية',
        nameEn: 'Jeddah Substation',
        type: 'substation',
        voltageLevel: 'MV',
        latitude: new Prisma.Decimal(21.4858),
        longitude: new Prisma.Decimal(39.1925),
        address: 'جدة، حي الروضة',
        capacity: new Prisma.Decimal(200),
        status: 'online',
      }
    }),
    prisma.scada_stations.create({
      data: {
        code: 'STN-003',
        name: 'محطة الدمام التوزيعية',
        nameEn: 'Dammam Distribution Station',
        type: 'distribution',
        voltageLevel: 'LV',
        latitude: new Prisma.Decimal(26.4207),
        longitude: new Prisma.Decimal(50.0888),
        address: 'الدمام، حي الفيصلية',
        capacity: new Prisma.Decimal(50),
        status: 'online',
      }
    }),
    prisma.scada_stations.create({
      data: {
        code: 'STN-004',
        name: 'محطة الطاقة الشمسية',
        nameEn: 'Solar Power Station',
        type: 'solar',
        voltageLevel: 'MV',
        latitude: new Prisma.Decimal(25.0000),
        longitude: new Prisma.Decimal(45.0000),
        address: 'منطقة نائية',
        capacity: new Prisma.Decimal(100),
        status: 'online',
      }
    }),
  ]);

  console.log(`✅ تم إنشاء ${stations.length} محطات`);

  // إنشاء الأجهزة لكل محطة
  const devices: any[] = [];
  for (const station of stations) {
    const stationDevices = await Promise.all([
      prisma.scada_devices.create({
        data: {
          stationId: station.id,
          code: `${station.code}-TRF-01`,
          name: `محول ${station.name}`,
          nameEn: `Transformer ${station.nameEn}`,
          type: 'transformer',
          manufacturer: 'ABB',
          model: 'KTRT-500',
          protocol: 'modbus_tcp',
          ipAddress: `192.168.1.${10 + stations.indexOf(station)}`,
          port: 502,
          slaveId: 1,
          status: 'online',
        }
      }),
      prisma.scada_devices.create({
        data: {
          stationId: station.id,
          code: `${station.code}-BRK-01`,
          name: `قاطع ${station.name}`,
          nameEn: `Breaker ${station.nameEn}`,
          type: 'breaker',
          manufacturer: 'Schneider',
          model: 'Masterpact MTZ',
          protocol: 'modbus_tcp',
          ipAddress: `192.168.1.${20 + stations.indexOf(station)}`,
          port: 502,
          slaveId: 2,
          status: 'online',
        }
      }),
      prisma.scada_devices.create({
        data: {
          stationId: station.id,
          code: `${station.code}-MTR-01`,
          name: `عداد ${station.name}`,
          nameEn: `Meter ${station.nameEn}`,
          type: 'meter',
          manufacturer: 'Acrel',
          model: 'ADW300',
          protocol: 'modbus_tcp',
          ipAddress: `192.168.1.${30 + stations.indexOf(station)}`,
          port: 502,
          slaveId: 3,
          status: 'online',
        }
      }),
    ]);
    devices.push(...stationDevices);
  }

  console.log(`✅ تم إنشاء ${devices.length} جهاز`);

  // إنشاء نقاط المراقبة
  const points: any[] = [];
  for (const device of devices) {
    const devicePoints = await Promise.all([
      prisma.monitoring_points.create({
        data: {
          stationId: device.stationId,
          deviceId: device.id,
          pointCode: `${device.code}-V-A`,
          name: 'جهد الطور A',
          pointType: 'analog',
          dataType: 'voltage',
          unit: 'V',
          minValue: new Prisma.Decimal(0),
          maxValue: new Prisma.Decimal(500),
          warningLow: new Prisma.Decimal(200),
          warningHigh: new Prisma.Decimal(250),
          alarmLow: new Prisma.Decimal(180),
          alarmHigh: new Prisma.Decimal(270),
          modbusAddress: '40001',
          scanInterval: 5,
        }
      }),
      prisma.monitoring_points.create({
        data: {
          stationId: device.stationId,
          deviceId: device.id,
          pointCode: `${device.code}-I-A`,
          name: 'تيار الطور A',
          pointType: 'analog',
          dataType: 'current',
          unit: 'A',
          minValue: new Prisma.Decimal(0),
          maxValue: new Prisma.Decimal(1000),
          warningLow: new Prisma.Decimal(0),
          warningHigh: new Prisma.Decimal(800),
          alarmLow: new Prisma.Decimal(0),
          alarmHigh: new Prisma.Decimal(900),
          modbusAddress: '40003',
          scanInterval: 5,
        }
      }),
      prisma.monitoring_points.create({
        data: {
          stationId: device.stationId,
          deviceId: device.id,
          pointCode: `${device.code}-P`,
          name: 'القدرة الفعالة',
          pointType: 'analog',
          dataType: 'power',
          unit: 'kW',
          minValue: new Prisma.Decimal(0),
          maxValue: new Prisma.Decimal(10000),
          warningLow: new Prisma.Decimal(0),
          warningHigh: new Prisma.Decimal(8000),
          alarmLow: new Prisma.Decimal(0),
          alarmHigh: new Prisma.Decimal(9000),
          modbusAddress: '40005',
          scanInterval: 5,
        }
      }),
      prisma.monitoring_points.create({
        data: {
          stationId: device.stationId,
          deviceId: device.id,
          pointCode: `${device.code}-STATUS`,
          name: 'حالة الجهاز',
          pointType: 'digital',
          dataType: 'status',
          unit: '',
          modbusAddress: '00001',
          scanInterval: 1,
        }
      }),
    ]);
    points.push(...devicePoints);
  }

  console.log(`✅ تم إنشاء ${points.length} نقطة مراقبة`);

  // إنشاء بعض التنبيهات
  const alerts = await Promise.all([
    prisma.alerts.create({
      data: {
        stationId: stations[0].id,
        pointId: points[0].id,
        alertCode: 'ALR-001',
        alertType: 'threshold',
        severity: 'warning',
        title: 'جهد مرتفع',
        message: 'جهد الطور A تجاوز حد التحذير الأعلى',
        value: new Prisma.Decimal(255),
        threshold: new Prisma.Decimal(250),
        status: 'active',
      }
    }),
    prisma.alerts.create({
      data: {
        stationId: stations[1].id,
        alertCode: 'ALR-002',
        alertType: 'communication',
        severity: 'critical',
        title: 'انقطاع الاتصال',
        message: 'انقطاع الاتصال بالجهاز',
        status: 'active',
      }
    }),
  ]);

  console.log(`✅ تم إنشاء ${alerts.length} تنبيهات`);

  // إنشاء بعض القراءات الحية
  for (const point of points.slice(0, 20)) {
    await prisma.live_readings.create({
      data: {
        pointId: point.id,
        value: new Prisma.Decimal(Math.random() * 100 + 200),
        quality: 'good',
      }
    });
  }

  console.log('✅ تم إنشاء قراءات حية');

  console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
