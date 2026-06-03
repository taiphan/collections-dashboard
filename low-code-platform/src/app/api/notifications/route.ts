import { withCtx } from '@/lib/api/handler';
import * as service from '@/lib/services/notifications';
import type { NotificationCursor } from '@/lib/db/repositories/notifications';

export const GET = withCtx(async ({ ctx, req }) => {
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unread') === '1';
  const limit = Number(url.searchParams.get('limit') ?? 30);
  const cursorParam = url.searchParams.get('cursor');
  let cursor: NotificationCursor | undefined;
  if (cursorParam) {
    try {
      cursor = JSON.parse(Buffer.from(cursorParam, 'base64').toString('utf8'));
    } catch {
      // ignore
    }
  }
  const page = await service.listForCurrentUser(ctx, { unreadOnly, cursor, limit });
  const unread = await service.unreadCount(ctx);
  return {
    rows: page.rows,
    nextCursor: page.nextCursor
      ? Buffer.from(JSON.stringify(page.nextCursor)).toString('base64')
      : null,
    unreadCount: unread,
  };
});
