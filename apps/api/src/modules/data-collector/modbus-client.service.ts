import { Injectable, Logger } from '@nestjs/common';
import ModbusRTU from 'modbus-serial';

export interface ModbusConnectionConfig {
  protocol: 'modbus_tcp' | 'modbus_rtu';
  ipAddress?: string;
  port?: number;
  slaveId: number;
  comPort?: string;
  baudRate?: number;
  timeout: number;
}

export interface ModbusReadResult {
  success: boolean;
  data?: number[];
  error?: string;
  latency?: number;
}

@Injectable()
export class ModbusClientService {
  private readonly logger = new Logger(ModbusClientService.name);
  private clients: Map<string, ModbusRTU> = new Map();

  async connect(connectionId: string, config: ModbusConnectionConfig): Promise<boolean> {
    try {
      const client = new ModbusRTU();
      client.setTimeout(config.timeout);

      if (config.protocol === 'modbus_tcp') {
        if (!config.ipAddress || !config.port) {
          throw new Error('IP address and port required for Modbus TCP');
        }
        await client.connectTCP(config.ipAddress, { port: config.port });
      } else if (config.protocol === 'modbus_rtu') {
        if (!config.comPort) {
          throw new Error('COM port required for Modbus RTU');
        }
        await client.connectRTUBuffered(config.comPort, {
          baudRate: config.baudRate || 9600,
        });
      }

      client.setID(config.slaveId);
      this.clients.set(connectionId, client);
      this.logger.log(`Connected to ${connectionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect to ${connectionId}: ${error.message}`);
      return false;
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    const client = this.clients.get(connectionId);
    if (client) {
      try {
        client.close(() => {});
        this.clients.delete(connectionId);
        this.logger.log(`Disconnected from ${connectionId}`);
      } catch (error) {
        this.logger.error(`Error disconnecting from ${connectionId}: ${error.message}`);
      }
    }
  }

  async readHoldingRegisters(
    connectionId: string,
    address: number,
    length: number,
  ): Promise<ModbusReadResult> {
    const startTime = Date.now();
    const client = this.clients.get(connectionId);

    if (!client) {
      return {
        success: false,
        error: 'Client not connected',
      };
    }

    try {
      const result = await client.readHoldingRegisters(address, length);
      return {
        success: true,
        data: result.data,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  async readInputRegisters(
    connectionId: string,
    address: number,
    length: number,
  ): Promise<ModbusReadResult> {
    const startTime = Date.now();
    const client = this.clients.get(connectionId);

    if (!client) {
      return {
        success: false,
        error: 'Client not connected',
      };
    }

    try {
      const result = await client.readInputRegisters(address, length);
      return {
        success: true,
        data: result.data,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  async readCoils(
    connectionId: string,
    address: number,
    length: number,
  ): Promise<ModbusReadResult> {
    const startTime = Date.now();
    const client = this.clients.get(connectionId);

    if (!client) {
      return {
        success: false,
        error: 'Client not connected',
      };
    }

    try {
      const result = await client.readCoils(address, length);
      return {
        success: true,
        data: result.data.map(v => v ? 1 : 0),
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  async readDiscreteInputs(
    connectionId: string,
    address: number,
    length: number,
  ): Promise<ModbusReadResult> {
    const startTime = Date.now();
    const client = this.clients.get(connectionId);

    if (!client) {
      return {
        success: false,
        error: 'Client not connected',
      };
    }

    try {
      const result = await client.readDiscreteInputs(address, length);
      return {
        success: true,
        data: result.data.map(v => v ? 1 : 0),
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  async writeSingleRegister(
    connectionId: string,
    address: number,
    value: number,
  ): Promise<ModbusReadResult> {
    const startTime = Date.now();
    const client = this.clients.get(connectionId);

    if (!client) {
      return {
        success: false,
        error: 'Client not connected',
      };
    }

    try {
      await client.writeRegister(address, value);
      return {
        success: true,
        data: [value],
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  async writeMultipleRegisters(
    connectionId: string,
    address: number,
    values: number[],
  ): Promise<ModbusReadResult> {
    const startTime = Date.now();
    const client = this.clients.get(connectionId);

    if (!client) {
      return {
        success: false,
        error: 'Client not connected',
      };
    }

    try {
      await client.writeRegisters(address, values);
      return {
        success: true,
        data: values,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  async writeSingleCoil(
    connectionId: string,
    address: number,
    value: boolean,
  ): Promise<ModbusReadResult> {
    const startTime = Date.now();
    const client = this.clients.get(connectionId);

    if (!client) {
      return {
        success: false,
        error: 'Client not connected',
      };
    }

    try {
      await client.writeCoil(address, value);
      return {
        success: true,
        data: [value ? 1 : 0],
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  isConnected(connectionId: string): boolean {
    const client = this.clients.get(connectionId);
    return client?.isOpen ?? false;
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.keys()).filter(id => this.isConnected(id));
  }

  async disconnectAll(): Promise<void> {
    for (const connectionId of this.clients.keys()) {
      await this.disconnect(connectionId);
    }
  }
}
