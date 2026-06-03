import { withCtx } from '@/lib/api/handler';
import * as service from '@/lib/services/manager-dashboard';

export const GET = withCtx(async ({ ctx }) => service.getDashboard(ctx));
