import { describe, expect, it } from 'vitest';
import { clampTtlHours, evaluateLink, generateToken, hashToken, isTokenShape } from './token';

describe('token de compartilhamento', () => {
  it('é único, tem o formato esperado e o hash não revela o token', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(isTokenShape(a)).toBe(true);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).not.toContain(a);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(hashToken(b));
  });
  it('recusa formato inválido antes de consultar o banco', () => {
    for (const t of ['', 'curto', 'x'.repeat(44), '../etc/passwd', 'a'.repeat(42) + '!']) expect(isTokenShape(t)).toBe(false);
  });
});

describe('validade', () => {
  it('limita a validade entre 1 h e 30 dias e usa 72 h por padrão', () => {
    expect(clampTtlHours(undefined)).toBe(72);
    expect(clampTtlHours('abc')).toBe(72);
    expect(clampTtlHours(0)).toBe(1);
    expect(clampTtlHours(100000)).toBe(720);
    expect(clampTtlHours(24)).toBe(24);
  });
  const now = new Date('2026-11-18T12:00:00Z');
  it('vale antes de expirar; expirado e revogado são recusados (revogado tem precedência)', () => {
    expect(evaluateLink({ expiresAt: new Date('2026-11-18T12:00:01Z'), revokedAt: null }, now)).toEqual({ valid: true });
    expect(evaluateLink({ expiresAt: now, revokedAt: null }, now)).toEqual({ valid: false, reason: 'expirado' });
    expect(evaluateLink({ expiresAt: new Date('2027-01-01'), revokedAt: now }, now)).toEqual({ valid: false, reason: 'revogado' });
    expect(evaluateLink({ expiresAt: new Date('2020-01-01'), revokedAt: now }, now)).toEqual({ valid: false, reason: 'revogado' });
  });
});
