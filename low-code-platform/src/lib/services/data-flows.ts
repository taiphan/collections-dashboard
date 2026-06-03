/**
 * V2.G — Data Flows / event pipelines stub.
 *
 * Production scope requires Kafka, dead-letter queueing, and a per-pipeline
 * SLO meter. This module documents the surface and surfaces `not_implemented`
 * so a future iteration can land the real adapter without renaming call
 * sites.
 */

import { HttpError } from '@/lib/auth/errors';

export interface PipelineSpec {
  id: string;
  source: { kind: 'kafka' | 'webhook'; config: Record<string, unknown> };
  transforms: Array<{ kind: string; config: Record<string, unknown> }>;
  sink: { kind: 'create_case' | 'update_case' | 'post_comment'; config: Record<string, unknown> };
}

export async function startPipeline(spec: PipelineSpec): Promise<never> {
  void spec;
  throw new HttpError(
    501,
    'not_implemented',
    'Data Flows are not enabled. See Pillar V2.G in requirements.md.',
  );
}
