import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/comments';

export const GET = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) =>
  service.listForCase(ctx, params.id),
);

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { body?: string; mentions?: string[] };
  return service.post(ctx, params.id, body.body ?? '', body.mentions ?? []);
});
