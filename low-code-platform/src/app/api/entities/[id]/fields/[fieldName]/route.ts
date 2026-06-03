import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/data-model';

export const DELETE = withCtxAndParams<{ id: string; fieldName: string }, unknown>(
  async ({ ctx, params }) => service.deleteFieldOnLatest(ctx, params.id, params.fieldName),
);
