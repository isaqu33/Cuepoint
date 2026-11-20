import { describe, expect, it } from 'vitest';
import { runPool, titleFromFilename, uniqueTitles } from './batch-upload';

describe('titleFromFilename', () => {
  it('tira a extensão e normaliza espaços e sublinhados', () => {
    expect(titleFromFilename('Aula_01__Introdução.mp3')).toBe('Aula 01 Introdução');
    expect(titleFromFilename('sem extensão')).toBe('sem extensão');
    expect(titleFromFilename('a.b.wav')).toBe('a.b');
  });
});

describe('uniqueTitles', () => {
  it('numera repetidos dentro do lote', () => {
    expect(uniqueTitles(['A', 'B', 'A', 'A'])).toEqual(['A', 'B', 'A (2)', 'A (3)']);
  });
});

describe('runPool', () => {
  it('respeita o limite de concorrência e processa todos', async () => {
    let active = 0;
    let peak = 0;
    const done: number[] = [];
    await runPool([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      done.push(n);
      active--;
    });
    expect(peak).toBe(2);
    expect(done.sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('um item que falha não interrompe os outros', async () => {
    const ok: number[] = [];
    await runPool([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error('falhou');
      ok.push(n);
    });
    expect(ok.sort()).toEqual([1, 3]);
  });
});
