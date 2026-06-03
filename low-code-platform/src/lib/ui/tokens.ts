/**
 * Constellation-inspired design tokens. (Pillar V2.B.)
 *
 * The platform exposes a fixed set of CSS-variable tokens and lets each
 * tenant override them. Tokens render as `style` on a wrapper element so the
 * cascade picks them up without requiring a stylesheet rebuild per tenant.
 */

import { z } from 'zod';

const colorRe = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\(--[\w-]+\))$/;

const tokenStringSchema = z.string().min(1).max(80);
const colorSchema = z.string().regex(colorRe, 'Must be a hex, rgb(a), hsl(a), or var() color.');

export const designTokensSchema = z
  .object({
    colors: z
      .object({
        background: colorSchema.optional(),
        foreground: colorSchema.optional(),
        primary: colorSchema.optional(),
        primaryForeground: colorSchema.optional(),
        accent: colorSchema.optional(),
        ring: colorSchema.optional(),
        border: colorSchema.optional(),
      })
      .partial()
      .optional(),
    radius: z
      .object({
        base: tokenStringSchema.optional(),
      })
      .partial()
      .optional(),
    typography: z
      .object({
        fontSans: tokenStringSchema.optional(),
        fontMono: tokenStringSchema.optional(),
      })
      .partial()
      .optional(),
  })
  .strict();

export type DesignTokens = z.infer<typeof designTokensSchema>;

const TOKEN_VAR_MAP: Record<string, string> = {
  'colors.background': '--background',
  'colors.foreground': '--foreground',
  'colors.primary': '--primary',
  'colors.primaryForeground': '--primary-foreground',
  'colors.accent': '--accent',
  'colors.ring': '--ring',
  'colors.border': '--border',
  'radius.base': '--radius',
  'typography.fontSans': '--font-sans',
  'typography.fontMono': '--font-mono',
};

/**
 * Convert tokens into inline CSS variable declarations suitable for a wrapper
 * `<div style={...}>`. Unknown keys are ignored. Empty input yields `{}`.
 */
export function tokensToCssVariables(tokens: DesignTokens | null | undefined): React.CSSProperties {
  if (!tokens) return {};
  const out: Record<string, string> = {};
  flatten('', tokens, out);
  const css: Record<string, string> = {};
  for (const [path, value] of Object.entries(out)) {
    const cssVar = TOKEN_VAR_MAP[path];
    if (cssVar) css[cssVar] = value;
  }
  return css as React.CSSProperties;
}

function flatten(prefix: string, value: unknown, out: Record<string, string>) {
  if (value == null) return;
  if (typeof value === 'string') {
    out[prefix] = value;
    return;
  }
  if (typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    flatten(prefix ? `${prefix}.${k}` : k, v, out);
  }
}
