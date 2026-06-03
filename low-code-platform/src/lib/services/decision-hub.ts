/**
 * V2.I — Customer Decision Hub adapter stub.
 *
 * Optional pillar; absent configuration MUST NOT block any other workflow
 * (Requirement V2.I #3). The case runtime never calls this module unless a
 * tenant has registered the adapter.
 */

import { HttpError } from '@/lib/auth/errors';

export interface DecisionHubRequest {
  customerId: string;
  context: Record<string, unknown>;
}

export async function nextBestAction(req: DecisionHubRequest): Promise<never> {
  void req;
  throw new HttpError(
    501,
    'not_implemented',
    'Customer Decision Hub adapter is not configured. See Pillar V2.I.',
  );
}
