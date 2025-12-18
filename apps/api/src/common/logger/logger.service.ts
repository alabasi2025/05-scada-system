import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  trace?: string;
  data?: any;
}

@Injectable()
export class JsonLoggerService implements NestLoggerService {
  private formatLog(level: string, message: any, context?: string, trace?: string): string {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context,
      trace,
    };

    return JSON.stringify(logEntry);
  }

  log(message: any, context?: string) {
    console.log(this.formatLog('INFO', message, context));
  }

  error(message: any, trace?: string, context?: string) {
    console.error(this.formatLog('ERROR', message, context, trace));
  }

  warn(message: any, context?: string) {
    console.warn(this.formatLog('WARN', message, context));
  }

  debug(message: any, context?: string) {
    console.debug(this.formatLog('DEBUG', message, context));
  }

  verbose(message: any, context?: string) {
    console.log(this.formatLog('VERBOSE', message, context));
  }

  // Audit logging for security events
  audit(action: string, userId: string, entityType: string, entityId?: string, data?: any) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      level: 'AUDIT',
      action,
      userId,
      entityType,
      entityId,
      data,
    };
    console.log(JSON.stringify(auditLog));
  }
}
