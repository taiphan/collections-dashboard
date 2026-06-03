-- V2.B: tenant-scoped design tokens for Constellation-style branding.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS design_tokens jsonb;
