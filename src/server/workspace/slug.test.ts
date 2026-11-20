import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from './slug';

describe('slug', () => {
  it('tira acentos e símbolos', () => {
    expect(slugify('Igreja São José — Sede!')).toBe('igreja-sao-jose-sede');
    expect(slugify('???')).toBe('espaco');
  });
  it('gera o primeiro slug livre', () => {
    expect(uniqueSlug('Igreja', new Set())).toBe('igreja');
    expect(uniqueSlug('Igreja', new Set(['igreja', 'igreja-2']))).toBe('igreja-3');
  });
});
