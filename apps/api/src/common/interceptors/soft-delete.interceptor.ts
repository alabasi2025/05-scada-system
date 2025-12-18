import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SoftDeleteInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Filter out soft-deleted records from responses
        if (Array.isArray(data)) {
          return data.filter((item) => !item.deletedAt);
        }
        return data;
      }),
    );
  }
}

// Soft delete helper functions
export const softDeleteFilter = {
  deletedAt: null,
};

export const softDeleteData = () => ({
  deletedAt: new Date(),
});

export const restoreData = () => ({
  deletedAt: null,
});
