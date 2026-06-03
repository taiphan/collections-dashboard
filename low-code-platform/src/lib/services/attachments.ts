/**
 * Attachment service. Implements Requirement 14 (1, 2, 3, 6, 7, 9, 10).
 */

import { withTenant } from '@/lib/db/repositories/base';
import * as attachRepo from '@/lib/db/repositories/attachments';
import * as caseRepo from '@/lib/db/repositories/cases';
import { getStorage } from '@/lib/storage';
import {
  ForbiddenError,
  HttpError,
  NotFoundError,
  ValidationFailedError,
} from '@/lib/auth/errors';
import { ROLES, hasRole } from '@/lib/rbac/roles';
import * as audit from '@/lib/services/audit';
import type { TenantContext } from '@/lib/tenancy/types';

class PayloadTooLargeError extends HttpError {
  constructor() {
    super(413, 'payload_too_large', 'Attachment exceeds the configured size limit.');
  }
}
class UnsupportedMediaError extends HttpError {
  constructor() {
    super(415, 'unsupported_media_type', 'Attachment content type is not allowed.');
  }
}

function maxBytes(): number {
  return Number(process.env.ATTACHMENT_MAX_BYTES ?? 20 * 1024 * 1024);
}
function allowedTypes(): readonly string[] {
  const raw = process.env.ATTACHMENT_ALLOWED_TYPES;
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function ensureCaseAccess(ctx: TenantContext, c: { currentAssigneeUserId: string | null; createdBy: string }): void {
  if (hasRole(ctx, ROLES.MANAGER) || hasRole(ctx, ROLES.PLATFORM_ADMIN)) return;
  if (c.currentAssigneeUserId === ctx.userId) return;
  if (c.createdBy === ctx.userId) return;
  throw new ForbiddenError();
}

export async function upload(
  ctx: TenantContext,
  caseId: string,
  file: { filename: string; contentType: string; bytes: Uint8Array },
): Promise<attachRepo.AttachmentRow> {
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, caseId);
  if (!c) throw new NotFoundError();
  ensureCaseAccess(ctx, c);

  if (file.bytes.byteLength > maxBytes()) throw new PayloadTooLargeError();
  const allow = allowedTypes();
  if (allow.length > 0 && !allow.includes(file.contentType)) throw new UnsupportedMediaError();
  if (!file.filename || file.filename.length > 255) {
    throw new ValidationFailedError({ formErrors: ['Filename must be 1–255 characters.'] });
  }

  // Property 10: tenant-prefixed key.
  const safeName = file.filename.replace(/[^A-Za-z0-9._-]/g, '_');
  const storageKey = `tenants/${ctx.tenantId}/cases/${caseId}/${Date.now()}-${safeName}`;

  await getStorage().put({ key: storageKey, body: file.bytes, contentType: file.contentType });

  const row = await attachRepo.create(q, {
    caseId,
    uploaderUserId: ctx.userId!,
    filename: file.filename,
    contentType: file.contentType,
    byteSize: file.bytes.byteLength,
    storageKey,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'attachment',
    artifactId: row.id,
    action: 'attachment_upload',
    metadata: { caseId, filename: file.filename, byteSize: file.bytes.byteLength },
  });

  return row;
}

export async function listForCase(
  ctx: TenantContext,
  caseId: string,
): Promise<attachRepo.AttachmentRow[]> {
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, caseId);
  if (!c) throw new NotFoundError();
  ensureCaseAccess(ctx, c);
  return attachRepo.listForCase(q, caseId);
}

export async function download(
  ctx: TenantContext,
  attachmentId: string,
): Promise<{ row: attachRepo.AttachmentRow; stream: ReadableStream<Uint8Array> }> {
  const q = withTenant(ctx.tenantId);
  const row = await attachRepo.getById(q, attachmentId);
  if (!row) throw new NotFoundError();
  const c = await caseRepo.getCase(q, row.caseId);
  if (!c) throw new NotFoundError();
  ensureCaseAccess(ctx, c);
  const obj = await getStorage().get(row.storageKey);
  return { row, stream: obj.body };
}

export async function remove(ctx: TenantContext, attachmentId: string): Promise<void> {
  const q = withTenant(ctx.tenantId);
  const row = await attachRepo.getById(q, attachmentId);
  if (!row) throw new NotFoundError();
  // Uploader or manager can delete.
  if (
    !hasRole(ctx, ROLES.MANAGER) &&
    !hasRole(ctx, ROLES.PLATFORM_ADMIN) &&
    row.uploaderUserId !== ctx.userId
  ) {
    throw new ForbiddenError();
  }
  await attachRepo.softDelete(q, attachmentId);
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'attachment',
    artifactId: attachmentId,
    action: 'attachment_delete',
    metadata: { caseId: row.caseId },
  });
}
