import { describe, expect, it, vi } from 'vitest';
import { createBus, createMemoryTransport } from './bus';
import { DURABLE, EVENTS_CHANNEL, buildEvent, type DomainEvent } from './contracts';

const quiet = { warn: vi.fn(), error: vi.fn() };
const queued = () => buildEvent('media.transcription.queued', 'aula-1', { lessonId: 'aula-1', userId: 'u1' });
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('contrato dos eventos', () => {
  it('monta o envelope com id único, versão e data', () => {
    const a = queued();
    const b = queued();
    expect(a.id).not.toBe(b.id);
    expect(a.version).toBe(1);
    expect(new Date(a.occurredAt).toString()).not.toBe('Invalid Date');
    expect(a.aggregateId).toBe('aula-1');
  });

  it('recusa dado fora do contrato', () => {
    expect(() =>
      buildEvent('media.transcription.progress', 'aula-1', { lessonId: 'aula-1', percent: 250 }),
    ).toThrow();
  });

  it('progresso é efêmero; os demais são duráveis', () => {
    expect(DURABLE['media.transcription.progress']).toBe(false);
    expect(DURABLE['media.transcription.queued']).toBe(true);
    expect(DURABLE['media.transcription.completed']).toBe(true);
    expect(DURABLE['media.transcription.failed']).toBe(true);
  });
});

describe('pub/sub', () => {
  it('entrega o mesmo evento a dois assinantes independentes', async () => {
    const bus = createBus(createMemoryTransport(), quiet);
    const tela: DomainEvent[] = [];
    const email: DomainEvent[] = [];
    await bus.subscribe('tela', (e) => void tela.push(e));
    await bus.subscribe('email', (e) => void email.push(e));

    const event = queued();
    await bus.publish(event);
    await tick();

    expect(tela).toEqual([event]);
    expect(email).toEqual([event]);
  });

  it('quem publica não depende de assinantes (nenhum assinante: sem erro)', async () => {
    const bus = createBus(createMemoryTransport(), quiet);
    await expect(bus.publish(queued())).resolves.toBeUndefined();
  });

  it('falha de um assinante não afeta os outros nem quem publica', async () => {
    const error = vi.fn();
    const bus = createBus(createMemoryTransport(), { warn: vi.fn(), error });
    const recebidos: string[] = [];
    await bus.subscribe('quebrado', () => {
      throw new Error('boom');
    });
    await bus.subscribe('saudavel', (e) => void recebidos.push(e.id));

    const event = queued();
    await expect(bus.publish(event)).resolves.toBeUndefined();
    await tick();

    expect(recebidos).toEqual([event.id]);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('quebrado'));
  });

  it('filtra por tipo de evento', async () => {
    const bus = createBus(createMemoryTransport(), quiet);
    const recebidos: string[] = [];
    await bus.subscribe('so-concluidas', (e) => void recebidos.push(e.type), ['media.transcription.completed']);

    await bus.publish(queued());
    await bus.publish(
      buildEvent('media.transcription.completed', 'aula-1', { lessonId: 'aula-1', userId: 'u1', durationMs: 900, language: 'auto' }),
    );
    await tick();

    expect(recebidos).toEqual(['media.transcription.completed']);
  });

  it('ignora mensagem fora do contrato sem derrubar o assinante', async () => {
    const transport = createMemoryTransport();
    const warn = vi.fn();
    const bus = createBus(transport, { warn, error: vi.fn() });
    const recebidos: string[] = [];
    await bus.subscribe('tela', (e) => void recebidos.push(e.id));

    await transport.publish(EVENTS_CHANNEL, '{"type":"qualquer.coisa"}');
    await transport.publish(EVENTS_CHANNEL, 'não é json');
    const valido = queued();
    await bus.publish(valido);
    await tick();

    expect(recebidos).toEqual([valido.id]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('não publica evento fora do contrato', async () => {
    const bus = createBus(createMemoryTransport(), quiet);
    await expect(bus.publish({ ...queued(), version: 2 } as unknown as DomainEvent)).rejects.toThrow();
  });

  it('cancelar a assinatura interrompe a entrega', async () => {
    const bus = createBus(createMemoryTransport(), quiet);
    const recebidos: string[] = [];
    const cancelar = await bus.subscribe('tela', (e) => void recebidos.push(e.id));

    await bus.publish(queued());
    await tick();
    await cancelar();
    await bus.publish(queued());
    await tick();

    expect(recebidos).toHaveLength(1);
  });
});
