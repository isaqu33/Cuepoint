import { createHash } from 'node:crypto';
import { prisma } from './utils/db';

export const hashRequest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

export type StoredResponse = { status: number; body: unknown };
export type IdempotencyOutcome =
  | { kind: 'replay'; response: StoredResponse }
  | { kind: 'conflict' }
  | { kind: 'fresh' };

const KEY_PATTERN = /^[A-Za-z0-9_\-:.]{8,128}$/;
export const isValidKey = (key: string) => KEY_PATTERN.test(key);

/** Procura resposta anterior para (escopo, chave). Mesma chave com pedido diferente = conflito (422 no chamador). */
export async function lookup(scope: string, key: string, requestHash: string): Promise<IdempotencyOutcome> {
  const found = await prisma.idempotencyKey.findUnique({ where: { scope_key: { scope, key } } });
  if (!found) return { kind: 'fresh' };
  if (found.requestHash !== requestHash) return { kind: 'conflict' };
  return { kind: 'replay', response: { status: found.status, body: found.body } };
}

/** Guarda a resposta; a restrição única protege de duas requisições simultâneas com a mesma chave. */
export async function store(scope: string, key: string, requestHash: string, response: StoredResponse) {
  await prisma.idempotencyKey
    .create({
      data: { scope, key, requestHash, status: response.status, body: response.body as object },
    })
    .catch(() => undefined);
}
