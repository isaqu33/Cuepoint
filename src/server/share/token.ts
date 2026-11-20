import { createHash, randomBytes } from 'node:crypto';

/** Token com 256 bits de entropia (impraticável de adivinhar). Só o hash vai ao banco. */
export const generateToken = (): string => randomBytes(32).toString('base64url');
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');
export const isTokenShape = (token: string): boolean => /^[A-Za-z0-9_-]{43}$/.test(token);

export const MIN_TTL_HOURS = 1;
export const MAX_TTL_HOURS = 24 * 30;
export const DEFAULT_TTL_HOURS = 72;

/** Validade pedida → horas dentro dos limites (padrão 72 h). */
export function clampTtlHours(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return DEFAULT_TTL_HOURS;
  return Math.min(MAX_TTL_HOURS, Math.max(MIN_TTL_HOURS, Math.round(n)));
}

export type LinkState = { valid: true } | { valid: false; reason: 'expirado' | 'revogado' };

/** O link ainda vale? Revogado tem precedência sobre expirado. */
export function evaluateLink(link: { expiresAt: Date; revokedAt: Date | null }, now: Date): LinkState {
  if (link.revokedAt) return { valid: false, reason: 'revogado' };
  if (link.expiresAt.getTime() <= now.getTime()) return { valid: false, reason: 'expirado' };
  return { valid: true };
}
