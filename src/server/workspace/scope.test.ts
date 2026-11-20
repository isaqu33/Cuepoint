import { describe, expect, it } from 'vitest';
import { scopeArgs } from './scope';
import { evaluateQuota } from './quota';

const WS = 'ws_b';

describe('scopeArgs', () => {
  it('não mexe em modelos sem espaço (sessões, workspace, links)', () => {
    const args = { where: { id: '1' } };
    expect(scopeArgs('Session', 'findMany', args, WS)).toBe(args);
    expect(scopeArgs('Workspace', 'findMany', args, WS)).toBe(args);
    expect(scopeArgs('ShareLink', 'findMany', args, WS)).toBe(args);
  });

  it('o histórico de eventos é escopado como os demais', () => {
    expect(scopeArgs('EventLog', 'findMany', { where: { aggregateId: 'x' } }, WS)).toEqual({ where: { AND: [{ aggregateId: 'x' }, { workspaceId: WS }] } });
  });

  it('listagens e contagens ganham o filtro, preservando o where original', () => {
    expect(scopeArgs('MediaFile', 'findMany', undefined, WS)).toEqual({ where: { workspaceId: WS } });
    expect(scopeArgs('Collection', 'count', { where: { title: 'x' } }, WS)).toEqual({
      where: { AND: [{ title: 'x' }, { workspaceId: WS }] },
    });
    expect(scopeArgs('Subcollection', 'deleteMany', { where: { id: 'a' } }, WS)).toEqual({
      where: { AND: [{ id: 'a' }, { workspaceId: WS }] },
    });
  });

  it('o filtro do espaço não pode ser anulado por um OR no where do chamador', () => {
    const r = scopeArgs('MediaFile', 'findMany', { where: { OR: [{ id: 'x' }, { workspaceId: 'ws_a' }] } }, WS) as {
      where: { AND: unknown[] };
    };
    expect(r.where.AND).toContainEqual({ workspaceId: WS });
  });

  it('operações por chave única exigem o espaço junto com o id (um id de outro espaço não é encontrado)', () => {
    expect(scopeArgs('MediaFile', 'findUnique', { where: { id: 'x' }, select: { id: true } }, WS)).toEqual({
      where: { id: 'x', workspaceId: WS },
      select: { id: true },
    });
    expect(scopeArgs('MediaFile', 'update', { where: { id: 'x' }, data: {} }, WS)).toMatchObject({ where: { id: 'x', workspaceId: WS } });
    expect(scopeArgs('User', 'delete', { where: { id: 'x' } }, WS)).toEqual({ where: { id: 'x', workspaceId: WS } });
  });

  it('um workspaceId diferente passado pelo chamador é sobrescrito no where (não dá para "pular" de espaço)', () => {
    const r = scopeArgs('MediaFile', 'findUnique', { where: { id: 'x', workspaceId: 'ws_a' } }, WS) as { where: Record<string, string> };
    expect(r.where.workspaceId).toBe(WS);
  });

  it('criações herdam o espaço; se o código já informou, respeita', () => {
    expect(scopeArgs('MediaFile', 'create', { data: { title: 't' } }, WS)).toEqual({ data: { title: 't', workspaceId: WS } });
    expect(scopeArgs('MediaFile', 'create', { data: { title: 't', workspaceId: 'ws_x' } }, WS)).toEqual({
      data: { title: 't', workspaceId: 'ws_x' },
    });
    expect(scopeArgs('MediaFile', 'createMany', { data: [{ title: 'a' }, { title: 'b' }] }, WS)).toEqual({
      data: [{ title: 'a', workspaceId: WS }, { title: 'b', workspaceId: WS }],
    });
    expect(scopeArgs('MediaFile', 'upsert', { where: { id: 'x' }, create: { title: 't' }, update: {} }, WS)).toEqual({
      where: { id: 'x', workspaceId: WS }, create: { title: 't', workspaceId: WS }, update: {},
    });
  });
});

describe('cota do espaço', () => {
  const limits = { maxFiles: 3, maxStorageBytes: 1000 };
  it('cabe até o limite exato', () => {
    expect(evaluateQuota({ files: 2, bytes: 500 }, limits, { files: 1, bytes: 500 })).toEqual({ ok: true });
  });
  it('recusa por quantidade e por armazenamento, com mensagem em português', () => {
    expect(evaluateQuota({ files: 3, bytes: 0 }, limits, { files: 1, bytes: 1 })).toMatchObject({ ok: false, reason: 'files' });
    const r = evaluateQuota({ files: 0, bytes: 900 }, limits, { files: 1, bytes: 200 });
    expect(r).toMatchObject({ ok: false, reason: 'storage' });
  });
  it('sem limite (nulo) nunca recusa', () => {
    expect(evaluateQuota({ files: 1e6, bytes: 1e15 }, { maxFiles: null, maxStorageBytes: null }, { files: 1, bytes: 1e12 })).toEqual({ ok: true });
  });
});
