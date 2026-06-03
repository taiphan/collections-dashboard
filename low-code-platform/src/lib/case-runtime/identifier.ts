/**
 * Human-readable case identifier generator.
 *
 * Format: <CASE_TYPE_SHORT_NAME>-<YEAR>-<6-digit zero-padded sequence>
 * Sequence wraps per (tenant, case_type, year). For MVP we derive the
 * sequence from a count of existing cases in that bucket; collisions are
 * extremely unlikely at MVP volumes and the unique index on
 * (tenant_id, identifier) acts as the final guard.
 */

import { sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { cases } from '@/lib/db/schema';

export async function nextIdentifier(
  db: Db,
  tenantId: string,
  caseTypeId: string,
  caseTypeName: string,
): Promise<string> {
  const year = new Date().getUTCFullYear();
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cases)
    .where(
      sql`${cases.tenantId} = ${tenantId}
        AND ${cases.caseTypeId} = ${caseTypeId}
        AND date_part('year', ${cases.createdAt}) = ${year}`,
    );
  const seq = Number(result[0]?.count ?? 0) + 1;
  const short = caseTypeName.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${short || 'CASE'}-${year}-${String(seq).padStart(6, '0')}`;
}
