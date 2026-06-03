import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/attachments';

export const GET = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) => {
  const { row, stream } = await service.download(ctx, params.id);
  return new Response(stream, {
    headers: {
      'Content-Type': row.contentType,
      'Content-Length': String(row.byteSize),
      'Content-Disposition': `attachment; filename="${row.filename.replace(/"/g, '')}"`,
    },
  });
});

export const DELETE = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) => {
  await service.remove(ctx, params.id);
  return { ok: true };
});
