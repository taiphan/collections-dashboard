/**
 * V2.C — GenAI Blueprint stub.
 *
 * The real implementation requires an LLM gateway with per-tenant rate limits,
 * a model selection policy, and a transcript audit stream. None of those
 * external services are available in this codebase, so this module surfaces
 * `not_implemented` and documents what's needed to ship.
 *
 * To implement (in order):
 *   1. Provision an LLM gateway adapter (lib/llm/gateway.ts) — OpenAI,
 *      Anthropic, Bedrock, or Azure OpenAI.
 *   2. Add per-tenant rate-limit + opt-out flags on the tenants table.
 *   3. Add a `blueprint_runs` table (tenant_id, prompt, response, model,
 *      latency, status). Append-only like audit.
 *   4. Implement `generate(ctx, brief)` — returns draft EntityDefinition,
 *      FormDefinition, and CaseTypeDefinition that pass our Zod schemas.
 *   5. Caller must NEVER persist the draft directly; it enters the standard
 *      versioning + publish flow on user save (Requirement V2.C #2).
 */

import { HttpError } from '@/lib/auth/errors';

export interface BlueprintBrief {
  description: string;
  industryHint?: string;
}

export interface BlueprintDraft {
  entities: unknown[];
  forms: unknown[];
  caseTypes: unknown[];
}

export async function generate(brief: BlueprintBrief): Promise<BlueprintDraft> {
  void brief;
  throw new HttpError(
    501,
    'not_implemented',
    'GenAI Blueprint is not enabled. Configure an LLM gateway and the blueprint_runs table per Pillar V2.C.',
  );
}
