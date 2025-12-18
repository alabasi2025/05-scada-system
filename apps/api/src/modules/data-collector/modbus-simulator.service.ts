import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';

interface ModbusRequest {
  transactionId: number;
  protocolId: number;
  length: number;
  unitId: number;
  functionCode: number;
  startAddress: number;
  quantity: number;
}

@Injectable()
export class ModbusSimulatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ModbusSimulatorService.name);
  private server: net.Server | null = null;
  private isEnabled = false;
  private port = 5020; // منفذ مختلف عن 502 الافتراضي

  // سجلات محاكاة
  private holdingRegisters: Map<number, number> = new Map();
  private inputRegisters: Map<number, number> = new Map();
  private coils: Map<number, boolean> = new Map();
  private discreteInputs: Map<number, boolean> = new Map();

  constructor(private configService: ConfigService) {
    this.isEnabled = this.configService.get('MODBUS_SIMULATOR_ENABLED', 'true') === 'true';
    this.port = parseInt(this.configService.get('MODBUS_SIMULATOR_PORT', '5020'), 10);
  }

  async onModuleInit() {
    if (this.isEnabled) {
      await this.initializeSimulatedData();
      await this.start();
    }
  }

  async onModuleDestroy() {
    await this.stop();
  }

  private async initializeSimulatedData() {
    // تهيئة بيانات محاكاة واقعية للكهرباء
    
    // الجهد (Voltage) - عناوين 0-9
    this.holdingRegisters.set(0, 2200);  // Phase A Voltage (220.0V * 10)
    this.holdingRegisters.set(1, 2195);  // Phase B Voltage
    this.holdingRegisters.set(2, 2205);  // Phase C Voltage
    
    // التيار (Current) - عناوين 10-19
    this.holdingRegisters.set(10, 150);  // Phase A Current (15.0A * 10)
    this.holdingRegisters.set(11, 148);  // Phase B Current
    this.holdingRegisters.set(12, 152);  // Phase C Current
    
    // القدرة (Power) - عناوين 20-29
    this.holdingRegisters.set(20, 3300); // Active Power (3.3kW * 1000)
    this.holdingRegisters.set(21, 500);  // Reactive Power (0.5kVAR * 1000)
    this.holdingRegisters.set(22, 3340); // Apparent Power (3.34kVA * 1000)
    
    // معامل القدرة (Power Factor) - عناوين 30-39
    this.holdingRegisters.set(30, 980);  // Power Factor (0.98 * 1000)
    
    // التردد (Frequency) - عناوين 40-49
    this.holdingRegisters.set(40, 5000); // Frequency (50.00Hz * 100)
    
    // الطاقة (Energy) - عناوين 50-59
    this.holdingRegisters.set(50, 12500); // Active Energy Low Word (kWh)
    this.holdingRegisters.set(51, 0);     // Active Energy High Word
    
    // درجة الحرارة (Temperature) - عناوين 60-69
    this.holdingRegisters.set(60, 350);  // Transformer Temp (35.0°C * 10)
    this.holdingRegisters.set(61, 280);  // Ambient Temp (28.0°C * 10)
    
    // حالة القواطع (Breaker Status) - Coils
    this.coils.set(0, true);   // Main Breaker - Closed
    this.coils.set(1, true);   // Feeder 1 - Closed
    this.coils.set(2, true);   // Feeder 2 - Closed
    this.coils.set(3, false);  // Feeder 3 - Open
    this.coils.set(4, true);   // Feeder 4 - Closed
    
    // إنذارات (Alarms) - Discrete Inputs
    this.discreteInputs.set(0, false);  // Over Voltage Alarm
    this.discreteInputs.set(1, false);  // Under Voltage Alarm
    this.discreteInputs.set(2, false);  // Over Current Alarm
    this.discreteInputs.set(3, false);  // Over Temperature Alarm
    this.discreteInputs.set(4, false);  // Earth Fault Alarm

    this.logger.log('تم تهيئة بيانات المحاكاة');
  }

  async start(): Promise<void> {
    if (this.server) {
      return;
    }

    this.server = net.createServer((socket) => {
      this.logger.debug(`New connection from ${socket.remoteAddress}`);

      socket.on('data', (data) => {
        this.handleRequest(socket, data);
      });

      socket.on('error', (err) => {
        this.logger.error(`Socket error: ${err.message}`);
      });

      socket.on('close', () => {
        this.logger.debug('Connection closed');
      });
    });

    this.server.listen(this.port, () => {
      this.logger.log(`Modbus Simulator started on port ${this.port}`);
    });

    // بدء تحديث البيانات بشكل دوري
    this.startDataSimulation();
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.logger.log('Modbus Simulator stopped');
    }
  }

  private handleRequest(socket: net.Socket, data: Buffer): void {
    if (data.length < 12) {
      return;
    }

    const request: ModbusRequest = {
      transactionId: data.readUInt16BE(0),
      protocolId: data.readUInt16BE(2),
      length: data.readUInt16BE(4),
      unitId: data.readUInt8(6),
      functionCode: data.readUInt8(7),
      startAddress: data.readUInt16BE(8),
      quantity: data.readUInt16BE(10),
    };

    let response: Buffer;

    switch (request.functionCode) {
      case 1: // Read Coils
        response = this.handleReadCoils(request);
        break;
      case 2: // Read Discrete Inputs
        response = this.handleReadDiscreteInputs(request);
        break;
      case 3: // Read Holding Registers
        response = this.handleReadHoldingRegisters(request);
        break;
      case 4: // Read Input Registers
        response = this.handleReadInputRegisters(request);
        break;
      case 5: // Write Single Coil
        response = this.handleWriteSingleCoil(request, data);
        break;
      case 6: // Write Single Register
        response = this.handleWriteSingleRegister(request, data);
        break;
      default:
        response = this.createExceptionResponse(request, 1); // Illegal Function
    }

    socket.write(response);
  }

  private handleReadHoldingRegisters(request: ModbusRequest): Buffer {
    const values: number[] = [];
    for (let i = 0; i < request.quantity; i++) {
      const addr = request.startAddress + i;
      values.push(this.holdingRegisters.get(addr) || 0);
    }

    const dataLength = request.quantity * 2;
    const response = Buffer.alloc(9 + dataLength);
    
    response.writeUInt16BE(request.transactionId, 0);
    response.writeUInt16BE(0, 2); // Protocol ID
    response.writeUInt16BE(3 + dataLength, 4); // Length
    response.writeUInt8(request.unitId, 6);
    response.writeUInt8(request.functionCode, 7);
    response.writeUInt8(dataLength, 8);

    for (let i = 0; i < values.length; i++) {
      response.writeUInt16BE(values[i], 9 + i * 2);
    }

    return response;
  }

  private handleReadInputRegisters(request: ModbusRequest): Buffer {
    const values: number[] = [];
    for (let i = 0; i < request.quantity; i++) {
      const addr = request.startAddress + i;
      values.push(this.inputRegisters.get(addr) || this.holdingRegisters.get(addr) || 0);
    }

    const dataLength = request.quantity * 2;
    const response = Buffer.alloc(9 + dataLength);
    
    response.writeUInt16BE(request.transactionId, 0);
    response.writeUInt16BE(0, 2);
    response.writeUInt16BE(3 + dataLength, 4);
    response.writeUInt8(request.unitId, 6);
    response.writeUInt8(request.functionCode, 7);
    response.writeUInt8(dataLength, 8);

    for (let i = 0; i < values.length; i++) {
      response.writeUInt16BE(values[i], 9 + i * 2);
    }

    return response;
  }

  private handleReadCoils(request: ModbusRequest): Buffer {
    const byteCount = Math.ceil(request.quantity / 8);
    const response = Buffer.alloc(9 + byteCount);
    
    response.writeUInt16BE(request.transactionId, 0);
    response.writeUInt16BE(0, 2);
    response.writeUInt16BE(3 + byteCount, 4);
    response.writeUInt8(request.unitId, 6);
    response.writeUInt8(request.functionCode, 7);
    response.writeUInt8(byteCount, 8);

    for (let byteIndex = 0; byteIndex < byteCount; byteIndex++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const coilIndex = request.startAddress + byteIndex * 8 + bit;
        if (coilIndex < request.startAddress + request.quantity) {
          if (this.coils.get(coilIndex)) {
            byte |= (1 << bit);
          }
        }
      }
      response.writeUInt8(byte, 9 + byteIndex);
    }

    return response;
  }

  private handleReadDiscreteInputs(request: ModbusRequest): Buffer {
    const byteCount = Math.ceil(request.quantity / 8);
    const response = Buffer.alloc(9 + byteCount);
    
    response.writeUInt16BE(request.transactionId, 0);
    response.writeUInt16BE(0, 2);
    response.writeUInt16BE(3 + byteCount, 4);
    response.writeUInt8(request.unitId, 6);
    response.writeUInt8(request.functionCode, 7);
    response.writeUInt8(byteCount, 8);

    for (let byteIndex = 0; byteIndex < byteCount; byteIndex++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const inputIndex = request.startAddress + byteIndex * 8 + bit;
        if (inputIndex < request.startAddress + request.quantity) {
          if (this.discreteInputs.get(inputIndex)) {
            byte |= (1 << bit);
          }
        }
      }
      response.writeUInt8(byte, 9 + byteIndex);
    }

    return response;
  }

  private handleWriteSingleCoil(request: ModbusRequest, data: Buffer): Buffer {
    const value = data.readUInt16BE(10) === 0xFF00;
    this.coils.set(request.startAddress, value);
    
    // Echo back the request
    return data.slice(0, 12);
  }

  private handleWriteSingleRegister(request: ModbusRequest, data: Buffer): Buffer {
    const value = data.readUInt16BE(10);
    this.holdingRegisters.set(request.startAddress, value);
    
    // Echo back the request
    return data.slice(0, 12);
  }

  private createExceptionResponse(request: ModbusRequest, exceptionCode: number): Buffer {
    const response = Buffer.alloc(9);
    
    response.writeUInt16BE(request.transactionId, 0);
    response.writeUInt16BE(0, 2);
    response.writeUInt16BE(3, 4);
    response.writeUInt8(request.unitId, 6);
    response.writeUInt8(request.functionCode | 0x80, 7);
    response.writeUInt8(exceptionCode, 8);

    return response;
  }

  private startDataSimulation(): void {
    // تحديث البيانات كل ثانية لمحاكاة قراءات حقيقية
    setInterval(() => {
      this.updateSimulatedData();
    }, 1000);
  }

  private updateSimulatedData(): void {
    // تحديث الجهد مع تذبذب طفيف
    this.holdingRegisters.set(0, this.fluctuate(2200, 10));
    this.holdingRegisters.set(1, this.fluctuate(2195, 10));
    this.holdingRegisters.set(2, this.fluctuate(2205, 10));

    // تحديث التيار
    this.holdingRegisters.set(10, this.fluctuate(150, 5));
    this.holdingRegisters.set(11, this.fluctuate(148, 5));
    this.holdingRegisters.set(12, this.fluctuate(152, 5));

    // تحديث القدرة
    const current = (this.holdingRegisters.get(10) || 150) / 10;
    const voltage = (this.holdingRegisters.get(0) || 2200) / 10;
    const power = Math.round(voltage * current);
    this.holdingRegisters.set(20, power);

    // تحديث التردد
    this.holdingRegisters.set(40, this.fluctuate(5000, 5));

    // تحديث درجة الحرارة
    this.holdingRegisters.set(60, this.fluctuate(350, 2));
    this.holdingRegisters.set(61, this.fluctuate(280, 1));

    // زيادة عداد الطاقة
    const currentEnergy = this.holdingRegisters.get(50) || 0;
    this.holdingRegisters.set(50, currentEnergy + 1);
  }

  private fluctuate(baseValue: number, range: number): number {
    return baseValue + Math.floor(Math.random() * range * 2) - range;
  }

  // API للتحكم في المحاكي
  setRegister(address: number, value: number): void {
    this.holdingRegisters.set(address, value);
  }

  getRegister(address: number): number {
    return this.holdingRegisters.get(address) || 0;
  }

  setCoil(address: number, value: boolean): void {
    this.coils.set(address, value);
  }

  getCoil(address: number): boolean {
    return this.coils.get(address) || false;
  }

  triggerAlarm(alarmIndex: number): void {
    this.discreteInputs.set(alarmIndex, true);
  }

  clearAlarm(alarmIndex: number): void {
    this.discreteInputs.set(alarmIndex, false);
  }

  getStatus(): { running: boolean; port: number; registers: number; coils: number } {
    return {
      running: this.server !== null,
      port: this.port,
      registers: this.holdingRegisters.size,
      coils: this.coils.size,
    };
  }
}
