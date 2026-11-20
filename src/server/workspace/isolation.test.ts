import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../utils/db';
import { runInWorkspace } from './context';
import { lessonVisible, transcriptionVisible } from './guard';
import { randomUUID } from 'node:crypto';

/**
 * Integração com o banco real (roda no container web / no CI): prova que um espaço de trabalho não enxerga
 * nem altera os dados de outro, por todos os caminhos de consulta que a aplicação usa.
 */
const tag = `iso${Date.now()}`;
const A = `${tag}-a`;
const B = `${tag}-b`;
const ids: Record<string, string> = {};

beforeAll(async () => {
  for (const [key, id] of [['A', A], ['B', B]] as const) {
    await prisma.workspace.create({ data: { id, name: `Espaço ${key}`, slug: id } });
    const user = await prisma.user.create({ data: { email: `${id}@teste.local`, username: id, workspaceId: id } });
    ids[`user${key}`] = user.id;
    const file = await prisma.mediaFile.create({ data: { title: `Arquivo ${id}`, userid: user.id, workspaceId: id, sizeBytes: BigInt(key === 'A' ? 100 : 900) } });
    ids[`file${key}`] = file.id;
    ids[`ev${key}`] = randomUUID();
    await prisma.eventLog.create({
      data: { eventId: ids[`ev${key}`], type: 'media.file.uploaded', aggregateId: file.id, data: { lessonId: file.id, userId: user.id, audioBytes: 1 }, occurredAt: new Date(), workspaceId: id },
    });
    const tr = await prisma.transcription.create({ data: { lessonId: file.id, transcription: '<p>x</p>', vtt: 'WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nx\n' } });
    ids[`tr${key}`] = tr.id;
    const col = await prisma.collection.create({ data: { title: `Coleção ${id}`, about: 'teste', workspaceId: id } });
    ids[`col${key}`] = col.id;
  }
});

afterAll(async () => {
  await prisma.transcription.deleteMany({ where: { id: { in: [ids.trA, ids.trB] } } });
  // Também remove o que um teste que falhou no meio possa ter deixado fora dos dois espaços.
  await prisma.mediaFile.deleteMany({ where: { OR: [{ workspaceId: { in: [A, B] } }, { title: { contains: tag } }] } });
  await prisma.transcription.deleteMany({ where: { id: { in: [ids.trA, ids.trB] } } });
  await prisma.eventLog.deleteMany({ where: { workspaceId: { in: [A, B] } } });
  await prisma.collection.deleteMany({ where: { workspaceId: { in: [A, B] } } });
  await prisma.user.deleteMany({ where: { workspaceId: { in: [A, B] } } });
  await prisma.workspace.deleteMany({ where: { id: { in: [A, B] } } });
});

const inA = <T>(fn: () => Promise<T>) => runInWorkspace(A, fn);

describe('isolamento entre espaços de trabalho (banco real)', () => {
  it('listar, contar e agregar só enxerga o próprio espaço', async () => {
    await inA(async () => {
      const files = await prisma.mediaFile.findMany({ where: { title: { startsWith: 'Arquivo iso' } } });
      expect(files.map((f) => f.id)).toEqual([ids.fileA]);
      expect(await prisma.mediaFile.count({ where: { title: { startsWith: 'Arquivo iso' } } })).toBe(1);
      const agg = await prisma.mediaFile.aggregate({ where: { title: { startsWith: 'Arquivo iso' } }, _sum: { sizeBytes: true } });
      expect(Number(agg._sum.sizeBytes)).toBe(100);
      expect((await prisma.collection.findMany({ where: { title: { startsWith: 'Coleção iso' } } })).map((c) => c.id)).toEqual([ids.colA]);
    });
  });

  it('buscar por id de outro espaço não encontra (findUnique, findFirst, findFirstOrThrow)', async () => {
    await inA(async () => {
      expect(await prisma.mediaFile.findUnique({ where: { id: ids.fileB } })).toBeNull();
      expect(await prisma.mediaFile.findFirst({ where: { id: ids.fileB } })).toBeNull();
      await expect(prisma.mediaFile.findFirstOrThrow({ where: { id: ids.fileB } })).rejects.toThrow();
      expect(await prisma.collection.findUnique({ where: { id: ids.colB } })).toBeNull();
      expect(await prisma.user.findUnique({ where: { id: ids.userB } })).toBeNull();
      expect(await prisma.mediaFile.findUnique({ where: { id: ids.fileA } })).not.toBeNull();
    });
  });

  it('um OR no where não vaza dados do outro espaço', async () => {
    await inA(async () => {
      const r = await prisma.mediaFile.findMany({ where: { OR: [{ id: ids.fileB }, { id: ids.fileA }] } });
      expect(r.map((f) => f.id)).toEqual([ids.fileA]);
    });
  });

  it('alterar e excluir arquivo de outro espaço falha e não muda nada', async () => {
    await inA(async () => {
      await expect(prisma.mediaFile.update({ where: { id: ids.fileB }, data: { title: 'invadido' } })).rejects.toThrow();
      await expect(prisma.mediaFile.delete({ where: { id: ids.fileB } })).rejects.toThrow();
      expect((await prisma.mediaFile.updateMany({ where: { id: ids.fileB }, data: { title: 'invadido' } })).count).toBe(0);
      expect((await prisma.mediaFile.deleteMany({ where: { id: ids.fileB } })).count).toBe(0);
    });
    const intact = await prisma.mediaFile.findUnique({ where: { id: ids.fileB } }); // sem contexto = visão do sistema
    expect(intact?.title).toBe(`Arquivo ${B}`);
  });

  it('upsert não toma um registro de outro espaço', async () => {
    await inA(async () => {
      await expect(
        prisma.mediaFile.upsert({ where: { id: ids.fileB }, update: { title: 'invadido' }, create: { title: `novo ${tag}`, userid: ids.userA } }),
      ).resolves.toBeDefined();
    });
    expect((await prisma.mediaFile.findUnique({ where: { id: ids.fileB } }))?.title).toBe(`Arquivo ${B}`);
    await prisma.mediaFile.deleteMany({ where: { title: `novo ${tag}` } });
  });

  it('criar dentro de um espaço grava no espaço (sem informar workspaceId)', async () => {
    const created = await inA(() => prisma.mediaFile.create({ data: { title: `Criado ${tag}`, userid: ids.userA } }));
    expect(created.workspaceId).toBe(A);
    await prisma.mediaFile.delete({ where: { id: created.id } });
  });

  it('não dá para "pular" de espaço informando outro workspaceId na consulta', async () => {
    await inA(async () => {
      expect(await prisma.mediaFile.findUnique({ where: { id: ids.fileB, workspaceId: B } as never })).toBeNull();
    });
  });

  it('o histórico de eventos (EventLog) é do espaço: não vaza o de outro', async () => {
    await inA(async () => {
      const mine = await prisma.eventLog.findMany({ where: { eventId: { in: [ids.evA, ids.evB] } } });
      expect(mine.map((e) => e.eventId)).toEqual([ids.evA]);
      expect(await prisma.eventLog.findMany({ where: { aggregateId: ids.fileB } })).toEqual([]);
    });
  });

  it('transcrição e arquivo de outro espaço não são visíveis (guarda das tabelas sem espaço próprio)', async () => {
    await inA(async () => {
      expect(await lessonVisible(ids.fileA)).toBe(true);
      expect(await lessonVisible(ids.fileB)).toBe(false);
      expect(await transcriptionVisible(ids.trA)).toBe(true);
      expect(await transcriptionVisible(ids.trB)).toBe(false);
    });
    expect(await transcriptionVisible(ids.trB)).toBe(true); // visão global (sistema)
  });

  it('sem contexto (worker, lotes, operador de plataforma) a visão é global', async () => {
    const all = await prisma.mediaFile.findMany({ where: { title: { startsWith: 'Arquivo iso' } } });
    expect(all.map((f) => f.id).sort()).toEqual([ids.fileA, ids.fileB].sort());
  });

  it('contextos simultâneos não se misturam', async () => {
    const [a, b] = await Promise.all([
      runInWorkspace(A, async () => { await new Promise((r) => setTimeout(r, 15)); return prisma.mediaFile.findMany({ where: { title: { startsWith: 'Arquivo iso' } } }); }),
      runInWorkspace(B, async () => prisma.mediaFile.findMany({ where: { title: { startsWith: 'Arquivo iso' } } })),
    ]);
    expect(a.map((f) => f.id)).toEqual([ids.fileA]);
    expect(b.map((f) => f.id)).toEqual([ids.fileB]);
  });
});
