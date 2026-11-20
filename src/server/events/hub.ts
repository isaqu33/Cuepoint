import type { DomainEvent } from './contracts';
import { getBus } from './publish';

type Listener = (event: DomainEvent) => void;

const byAggregate = new Map<string, Set<Listener>>();
let started: Promise<unknown> | undefined;

/**
 * Fan-out em processo: UMA assinatura Redis por instância web serve todas as conexões SSE
 * (em vez de uma conexão Redis por navegador). Quem escuta só recebe eventos do seu aggregateId.
 */
export async function listenAggregate(aggregateId: string, listener: Listener): Promise<() => void> {
  started ??= getBus()
    .subscribe('sse-hub', (event) => {
      for (const l of byAggregate.get(event.aggregateId) ?? []) {
        try {
          l(event);
        } catch {
          /* um cliente com problema não afeta os outros */
        }
      }
    })
    .catch((err) => {
      started = undefined;
      throw err;
    });
  await started;

  const set = byAggregate.get(aggregateId) ?? new Set<Listener>();
  set.add(listener);
  byAggregate.set(aggregateId, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) byAggregate.delete(aggregateId);
  };
}
