import { describe, expect, it } from 'vitest';
import { cutoff, lessonIdFromJobId, selectOrphans } from './plan';

const now = new Date('2026-11-17T02:00:00Z');
const ago = (min: number) => new Date(now.getTime() - min * 60_000);

describe('reconciliação', () => {
  const candidates = [
    { id: 'a', updatedAt: ago(60) },
    { id: 'b', updatedAt: ago(30) },
    { id: 'c', updatedAt: ago(2) }, // recente: dentro da tolerância
    { id: 'd', updatedAt: ago(90) }, // tem job vivo
  ];

  it('seleciona só os sem job vivo e fora da tolerância, do mais antigo ao mais novo', () => {
    expect(selectOrphans(candidates, new Set(['d']), now, 10 * 60_000, 100)).toEqual(['a', 'b']);
  });

  it('respeita o limite do lote', () => {
    expect(selectOrphans(candidates, new Set(), now, 10 * 60_000, 1)).toEqual(['d']);
  });

  it('nada a fazer quando todos têm job vivo', () => {
    expect(selectOrphans(candidates, new Set(['a', 'b', 'c', 'd']), now, 0, 10)).toEqual([]);
  });

  it('extrai o id do arquivo a partir do id do job', () => {
    expect(lessonIdFromJobId('transcribe-xyz')).toBe('xyz');
    expect(lessonIdFromJobId('outro-job')).toBeNull();
  });

  it('calcula o limite de retenção', () => {
    expect(cutoff(now, 86_400_000).toISOString()).toBe('2026-11-16T02:00:00.000Z');
  });
});

import { evaluateBackups, selectExpired, selectOrphanObjects } from './plan';

describe('órfãos do storage', () => {
  const U = '123e4567-e89b-12d3-a456-426614174000';
  const V = '123e4567-e89b-12d3-a456-426614174001';
  const objs = [
    { name: `audio_${U}.mp3`, lastModified: ago(60 * 48) }, // órfão antigo
    { name: `image_${V}.png`, lastModified: ago(60 * 48) }, // referenciado
    { name: `audio_${V}.wav`, lastModified: ago(30) }, // órfão, mas recente (envio em andamento)
    { name: 'lesson_antigo.jpeg', lastModified: ago(60 * 999) }, // legado: nunca tocar
  ];
  it('seleciona só o órfão antigo com chave gerada pelo servidor', () => {
    expect(selectOrphanObjects(objs, new Set([`image_${V}.png`]), now, 24 * 3_600_000, 10)).toEqual([`audio_${U}.mp3`]);
  });
  it('respeita o limite', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ name: `audio_${U.slice(0, -1)}${i}.mp3`, lastModified: ago(60 * 48) }));
    expect(selectOrphanObjects(many, new Set(), now, 0, 2)).toHaveLength(2);
  });
});

describe('retenção', () => {
  const items = [
    { id: 'velho', updatedAt: ago(60 * 24 * 40) },
    { id: 'meio', updatedAt: ago(60 * 24 * 20) },
    { id: 'novo', updatedAt: ago(60) },
  ];
  it('seleciona o que passou do prazo, do mais antigo ao mais novo', () => {
    expect(selectExpired(items, now, 15, 10)).toEqual(['velho', 'meio']);
    expect(selectExpired(items, now, 30, 10)).toEqual(['velho']);
  });
  it('0 ou negativo desliga; respeita o limite', () => {
    expect(selectExpired(items, now, 0, 10)).toEqual([]);
    expect(selectExpired(items, now, 15, 1)).toEqual(['velho']);
  });
});

describe('verificação de backup', () => {
  const f = (name: string, minAgo: number, size = 1000) => ({ name, mtime: ago(minAgo), size });
  it('ok quando o mais recente é novo e tem conteúdo', () => {
    expect(evaluateBackups([f('a.dump', 600), f('b.dump', 60)], now, 26 * 3_600_000)).toMatchObject({ ok: true, latest: 'b.dump', ageHours: 1 });
  });
  it('falha sem backup, com backup antigo e com arquivo vazio', () => {
    expect(evaluateBackups([f('notas.txt', 5)], now, 1e9)).toMatchObject({ ok: false, reason: 'nenhum-backup' });
    expect(evaluateBackups([f('a.dump', 60 * 40)], now, 26 * 3_600_000)).toMatchObject({ ok: false, reason: 'backup-antigo' });
    expect(evaluateBackups([f('a.dump', 5, 0)], now, 26 * 3_600_000)).toMatchObject({ ok: false, reason: 'backup-vazio' });
  });
});
