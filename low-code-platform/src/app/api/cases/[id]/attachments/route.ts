import { withCtxAndParams } from '@/lib/api/handler';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as service from '@/lib/services/attachments';

export const GET = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) =>
  service.listForCase(ctx, params.id),
);

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    throw new ValidationFailedError({ formErrors: ['file is required (multipart form data).'] });
  }
  const buffer = new Uint8Array(await file.arrayBuffer());
  return service.upload(ctx, params.id, {
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    bytes: buffer,
  });
});
