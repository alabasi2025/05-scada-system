import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip, headers } = request;

    // Determine action type
    let action = 'read';
    if (method === 'POST') action = 'create';
    else if (method === 'PUT' || method === 'PATCH') action = 'update';
    else if (method === 'DELETE') action = 'delete';

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Log audit trail for write operations
          if (['create', 'update', 'delete'].includes(action)) {
            await this.prisma.scada_audit_log.create({
              data: {
                userId: user?.sub || null,
                action,
                entityType: this.extractEntityType(url),
                entityId: response?.id || null,
                oldValues: action === 'update' ? body : null,
                newValues: action !== 'delete' ? response : null,
                ipAddress: ip || headers['x-forwarded-for'] || null,
                userAgent: headers['user-agent'] || null,
              },
            });
          }
        } catch (error) {
          // Log error but don't fail the request
          console.error('Audit logging failed:', error);
        }
      }),
    );
  }

  private extractEntityType(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // Extract entity type from URL (e.g., /api/v1/stations -> stations)
    const entityIndex = parts.findIndex((p) => p === 'v1') + 1;
    return parts[entityIndex] || 'unknown';
  }
}
