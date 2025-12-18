import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';

const connectionString = process.env.DATABASE_URL || 'postgresql://scada_user:scada_pass123@localhost:5432/scada_db?schema=public';
console.log('Connecting to database...');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...');

  // إنشاء المحطات
  const stations = await Promise.all([
    prisma.scadaStation.create({
      data: {
        code: 'STN-001',
        name: 'محطة الرياض الرئيسية',
        nameEn: 'Riyadh Main Station',
        type: 'main',
        voltage: '33kv',
        capacity: new Prisma.Decimal(500),
        latitude: new Prisma.Decimal(24.7136),
        longitude: new Prisma.Decimal(46.6753),
        address: 'شارع الملك فهد، الرياض',
        commissionDate: new Date('2020-01-15'),
        status: 'online',
      },
    }),
    prisma.scadaStation.create({
      data: {
        code: 'STN-002',
        name: 'محطة جدة الفرعية',
        nameEn: 'Jeddah Sub Station',
        type: 'sub',
        voltage: '11kv',
        capacity: new Prisma.Decimal(200),
        latitude: new Prisma.Decimal(21.4858),
        longitude: new Prisma.Decimal(39.1925),
        address: 'حي الروضة، جدة',
        commissionDate: new Date('2021-06-20'),
        status: 'online',
      },
    }),
    prisma.scadaStation.create({
      data: {
        code: 'STN-003',
        name: 'محطة الدمام التوزيعية',
        nameEn: 'Dammam Distribution Station',
        type: 'distribution',
        voltage: '0.4kv',
        capacity: new Prisma.Decimal(50),
        latitude: new Prisma.Decimal(26.4207),
        longitude: new Prisma.Decimal(50.0888),
        address: 'حي الفيصلية، الدمام',
        commissionDate: new Date('2022-03-10'),
        status: 'online',
      },
    }),
    prisma.scadaStation.create({
      data: {
        code: 'STN-004',
        name: 'محطة الطاقة الشمسية',
        nameEn: 'Solar Power Station',
        type: 'solar',
        voltage: '11kv',
        capacity: new Prisma.Decimal(100),
        latitude: new Prisma.Decimal(25.2048),
        longitude: new Prisma.Decimal(45.8361),
        address: 'منطقة الخرج',
        commissionDate: new Date('2023-01-01'),
        status: 'online',
      },
    }),
  ]);

  console.log(`✅ تم إنشاء ${stations.length} محطات`);

  // إنشاء الأجهزة لكل محطة
  const devices = [];
  for (const station of stations) {
    const stationDevices = await Promise.all([
      prisma.scadaDevice.create({
        data: {
          stationId: station.id,
          code: `${station.code}-TR-01`,
          name: 'محول رئيسي 1',
          type: 'transformer',
          manufacturer: 'ABB',
          model: 'TX-500',
          serialNo: `SN-${Date.now()}-1`,
          ratedCapacity: new Prisma.Decimal(100),
          ratedVoltage: new Prisma.Decimal(33),
          ratedCurrent: new Prisma.Decimal(1000),
          installDate: new Date('2020-01-15'),
          status: 'active',
        },
      }),
      prisma.scadaDevice.create({
        data: {
          stationId: station.id,
          code: `${station.code}-CB-01`,
          name: 'قاطع رئيسي 1',
          type: 'breaker',
          manufacturer: 'Siemens',
          model: 'CB-3000',
          serialNo: `SN-${Date.now()}-2`,
          ratedVoltage: new Prisma.Decimal(33),
          ratedCurrent: new Prisma.Decimal(2000),
          installDate: new Date('2020-01-15'),
          status: 'active',
        },
      }),
      prisma.scadaDevice.create({
        data: {
          stationId: station.id,
          code: `${station.code}-MT-01`,
          name: 'عداد الطاقة الرئيسي',
          type: 'meter',
          manufacturer: 'Schneider',
          model: 'PM-800',
          serialNo: `SN-${Date.now()}-3`,
          installDate: new Date('2020-01-15'),
          status: 'active',
        },
      }),
    ]);
    devices.push(...stationDevices);
  }

  console.log(`✅ تم إنشاء ${devices.length} جهاز`);

  // إنشاء نقاط القياس لكل جهاز
  const dataPoints = [];
  for (const device of devices) {
    if (device.type === 'transformer' || device.type === 'meter') {
      const deviceDataPoints = await Promise.all([
        prisma.scadaDataPoint.create({
          data: {
            deviceId: device.id,
            code: 'V_A',
            name: 'جهد الطور A',
            unit: 'V',
            dataType: 'analog',
            minValue: new Prisma.Decimal(0),
            maxValue: new Prisma.Decimal(500),
            warningLow: new Prisma.Decimal(200),
            warningHigh: new Prisma.Decimal(250),
            alarmLow: new Prisma.Decimal(180),
            alarmHigh: new Prisma.Decimal(270),
            scaleFactor: new Prisma.Decimal(1),
            modbusAddress: 100,
            isActive: true,
          },
        }),
        prisma.scadaDataPoint.create({
          data: {
            deviceId: device.id,
            code: 'I_A',
            name: 'تيار الطور A',
            unit: 'A',
            dataType: 'analog',
            minValue: new Prisma.Decimal(0),
            maxValue: new Prisma.Decimal(2000),
            warningHigh: new Prisma.Decimal(1500),
            alarmHigh: new Prisma.Decimal(1800),
            scaleFactor: new Prisma.Decimal(1),
            modbusAddress: 110,
            isActive: true,
          },
        }),
        prisma.scadaDataPoint.create({
          data: {
            deviceId: device.id,
            code: 'P_TOTAL',
            name: 'القدرة الفعالة الكلية',
            unit: 'kW',
            dataType: 'analog',
            minValue: new Prisma.Decimal(0),
            maxValue: new Prisma.Decimal(1000),
            scaleFactor: new Prisma.Decimal(1),
            modbusAddress: 120,
            isActive: true,
          },
        }),
        prisma.scadaDataPoint.create({
          data: {
            deviceId: device.id,
            code: 'E_TOTAL',
            name: 'الطاقة الكلية',
            unit: 'kWh',
            dataType: 'counter',
            minValue: new Prisma.Decimal(0),
            scaleFactor: new Prisma.Decimal(1),
            modbusAddress: 130,
            isActive: true,
          },
        }),
      ]);
      dataPoints.push(...deviceDataPoints);
    } else if (device.type === 'breaker') {
      const deviceDataPoints = await Promise.all([
        prisma.scadaDataPoint.create({
          data: {
            deviceId: device.id,
            code: 'STATUS',
            name: 'حالة القاطع',
            unit: '',
            dataType: 'digital',
            minValue: new Prisma.Decimal(0),
            maxValue: new Prisma.Decimal(1),
            modbusAddress: 200,
            isActive: true,
          },
        }),
      ]);
      dataPoints.push(...deviceDataPoints);
    }
  }

  console.log(`✅ تم إنشاء ${dataPoints.length} نقطة قياس`);

  // إنشاء قراءات تجريبية
  const readings = [];
  for (const dp of dataPoints.slice(0, 10)) {
    const baseValue = dp.dataType === 'analog' 
      ? (Number(dp.minValue) + Number(dp.maxValue)) / 2 
      : 0;
    
    for (let i = 0; i < 5; i++) {
      const variation = dp.dataType === 'analog' 
        ? (Math.random() - 0.5) * 20 
        : Math.round(Math.random());
      
      readings.push({
        deviceId: dp.deviceId,
        dataPointId: dp.id,
        value: new Prisma.Decimal(baseValue + variation),
        quality: 'good',
        timestamp: new Date(Date.now() - i * 60000),
      });
    }
  }

  await prisma.scadaReading.createMany({ data: readings });
  console.log(`✅ تم إنشاء ${readings.length} قراءة`);

  // إنشاء بعض التنبيهات
  const alarms = await Promise.all([
    prisma.scadaAlarm.create({
      data: {
        alarmNo: 'ALM-001',
        stationId: stations[0].id,
        deviceId: devices[0].id,
        dataPointId: dataPoints[0].id,
        severity: 'warning',
        message: 'جهد الطور A تجاوز حد التحذير الأعلى',
        value: new Prisma.Decimal(255),
        threshold: new Prisma.Decimal(250),
        status: 'active',
      },
    }),
    prisma.scadaAlarm.create({
      data: {
        alarmNo: 'ALM-002',
        stationId: stations[1].id,
        deviceId: devices[3].id,
        severity: 'critical',
        message: 'انقطاع الاتصال بالجهاز',
        status: 'active',
      },
    }),
  ]);

  console.log(`✅ تم إنشاء ${alarms.length} تنبيه`);

  // إنشاء اتصالات المحطات
  await Promise.all(
    stations.map((station, index) =>
      prisma.scadaConnection.create({
        data: {
          stationId: station.id,
          protocol: index % 2 === 0 ? 'modbus_tcp' : 'iec104',
          ipAddress: `192.168.1.${10 + index}`,
          port: index % 2 === 0 ? 502 : 2404,
          slaveId: 1,
          pollInterval: 5,
          timeout: 3000,
          isEnabled: true,
        },
      })
    )
  );

  console.log('✅ تم إنشاء اتصالات المحطات');

  console.log('');
  console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
  console.log('');
  console.log('📊 ملخص البيانات:');
  console.log(`   - المحطات: ${stations.length}`);
  console.log(`   - الأجهزة: ${devices.length}`);
  console.log(`   - نقاط القياس: ${dataPoints.length}`);
  console.log(`   - القراءات: ${readings.length}`);
  console.log(`   - التنبيهات: ${alarms.length}`);
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
