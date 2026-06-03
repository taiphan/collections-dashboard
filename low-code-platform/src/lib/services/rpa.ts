/**
 * V2.F — RPA / robotic worker stub.
 *
 * Requires an external robot orchestrator (Pega Robot Manager, UiPath
 * Orchestrator, Blue Prism, or self-hosted equivalent). This module exposes
 * the shape the case runtime would call but throws `not_implemented` until
 * a Robot_Registry adapter is wired in.
 */

import { HttpError } from '@/lib/auth/errors';

export interface RobotInvocation {
  robotId: string;
  inputs: Record<string, unknown>;
  /** Concurrency budget per tenant. Enforced by the registry implementation. */
  concurrencyKey?: string;
}

export interface RobotResult {
  status: 'completed' | 'failed';
  outputs?: Record<string, unknown>;
  error?: string;
}

export async function invokeRobot(input: RobotInvocation): Promise<RobotResult> {
  void input;
  throw new HttpError(
    501,
    'not_implemented',
    'RPA is not enabled. Wire a Robot_Registry adapter per Pillar V2.F.',
  );
}
