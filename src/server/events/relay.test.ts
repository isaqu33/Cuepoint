import { describe, expect, it, vi } from 'vitest';
import { buildEvent } from './contracts';
import { relayUnpublished, rowToEvent, type RelayDeps, type UnpublishedRow } from './relay';

const rowFrom = (e: ReturnType<typeof buildEvent>): UnpublishedRow => ({
  eventId: e.id, type: e.type, aggregateId: e.aggregateId, version: e.version, data: e.data, occurredAt: new Date(e.occurredAt),
});
const queued = () => buildEvent('media.transcription.queued', 'aula-1', { lessonId: 'aula-1', userId: 'u1' });

describe('relay do outbox', () => {
  it('reconstrói o mesmo evento (mesmo id) a partir da linha do log', () => {
    const e = queued();
    expect(rowToEvent(rowFrom(e))).toEqual(e);
  });

  it('ignora linha que não obedece ao contrato', () => {
    expect(rowToEvent({ ...rowFrom(queued()), type: 'media.coisa.estranha' })).toBeNull();
    expect(rowToEvent({ ...rowFrom(queued()), data: { lessonId: 1 } })).toBeNull();
  });

  it('republica o que ficou sem publicação e conta falhas e inválidos', async () => {
    const a = queued();
    const b = buildEvent('media.file.uploaded', 'aula-2', { lessonId: 'aula-2', userId: 'u1', audioBytes: 10 });
    const bad = { ...rowFrom(queued()), type: 'x.y' };
    const publish = vi.fn(async (ev: { id: string }) => ev.id !== b.id); // b falha (Redis ainda fora)
    const deps: RelayDeps = { listUnpublished: async () => [rowFrom(a), rowFrom(b), bad], publish };
    expect(await relayUnpublished(deps)).toEqual({ found: 3, republished: 1, failed: 1, invalid: 1 });
    expect(publish).toHaveBeenCalledTimes(2);
  });

  it('usa a tolerância para não disputar com quem acabou de publicar', async () => {
    const listUnpublished = vi.fn(async () => []);
    const now = new Date('2026-11-18T10:00:00Z');
    await relayUnpublished({ listUnpublished, publish: async () => true }, { now, graceMs: 60_000, limit: 5 });
    expect(listUnpublished).toHaveBeenCalledWith(new Date('2026-11-18T09:59:00Z'), 5);
  });

  it('aceita os eventos de outros domínios', () => {
    expect(() => buildEvent('media.file.deleted', 'a', { lessonId: 'a', reason: 'retention' })).not.toThrow();
    expect(() => buildEvent('identity.member.invited', 'm1', { memberId: 'm1' })).not.toThrow();
    expect(() => buildEvent('media.file.deleted', 'a', { lessonId: 'a', reason: 'outro' as never })).toThrow();
  });
});
