import Redis, { type RedisOptions } from 'ioredis';
import { EVENTS_CHANNEL, eventSchema, type DomainEvent, type EventType } from './contracts';

/** Meio de transporte do tópico. Redis em produção; memória nos testes. */
export interface Transport {
  publish(channel: string, message: string): Promise<void>;
  subscribe(channel: string, onMessage: (message: string) => void): Promise<() => Promise<void>>;
}

type Logger = Pick<Console, 'warn' | 'error'>;

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  /**
   * Registra um assinante independente. Falha de um assinante nunca afeta
   * os outros nem quem publica. Retorna a função de cancelamento.
   */
  subscribe(
    name: string,
    handler: (event: DomainEvent) => void | Promise<void>,
    types?: EventType[],
  ): Promise<() => Promise<void>>;
}

export function createBus(transport: Transport, log: Logger = console): EventBus {
  return {
    async publish(event) {
      eventSchema.parse(event); // não publica evento fora do contrato
      await transport.publish(EVENTS_CHANNEL, JSON.stringify(event));
    },

    subscribe(name, handler, types) {
      return transport.subscribe(EVENTS_CHANNEL, async (raw) => {
        let event: DomainEvent;
        try {
          event = eventSchema.parse(JSON.parse(raw));
        } catch (err) {
          log.warn(`[events:${name}] mensagem fora do contrato ignorada: ${(err as Error).message.slice(0, 120)}`);
          return;
        }
        if (types && !types.includes(event.type)) return;
        try {
          await handler(event);
        } catch (err) {
          log.error(`[events:${name}] falhou ao tratar ${event.type} (${event.id}): ${(err as Error).message}`);
        }
      });
    },
  };
}

/** Transporte em memória (testes): entrega a todos os assinantes, como o Redis faria. */
export function createMemoryTransport(): Transport {
  const listeners = new Map<string, Set<(m: string) => void>>();
  return {
    async publish(channel, message) {
      for (const l of listeners.get(channel) ?? []) l(message);
    },
    async subscribe(channel, onMessage) {
      const set = listeners.get(channel) ?? new Set();
      set.add(onMessage);
      listeners.set(channel, set);
      return async () => void set.delete(onMessage);
    },
  };
}

/** Redis Pub/Sub: uma conexão para publicar e uma dedicada por assinatura. */
export function createRedisTransport(options: RedisOptions): Transport {
  let publisher: Redis | undefined;
  return {
    async publish(channel, message) {
      publisher ??= new Redis({ ...options, lazyConnect: false, maxRetriesPerRequest: 2 });
      await publisher.publish(channel, message);
    },
    async subscribe(channel, onMessage) {
      const sub = new Redis(options);
      await sub.subscribe(channel);
      sub.on('message', (_ch, message) => onMessage(message));
      return async () => void (await sub.quit());
    },
  };
}
