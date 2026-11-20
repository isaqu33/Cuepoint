import { randomBytes } from 'node:crypto';

/** W3C Trace Context (compatível com OpenTelemetry): `00-<32 hex>-<16 hex>-<2 hex>`. Funções puras. */
const TRACEPARENT = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
const ZERO_TRACE = '0'.repeat(32);
const ZERO_SPAN = '0'.repeat(16);

export interface TraceParent {
  traceId: string;
  spanId: string;
  flags: string;
}

export function parseTraceparent(header: string | null | undefined): TraceParent | null {
  const m = TRACEPARENT.exec((header ?? '').trim().toLowerCase());
  if (!m || m[1] === ZERO_TRACE || m[2] === ZERO_SPAN) return null;
  return { traceId: m[1], spanId: m[2], flags: m[3] };
}

export const formatTraceparent = (t: TraceParent): string => `00-${t.traceId}-${t.spanId}-${t.flags}`;
export const newSpanId = (): string => randomBytes(8).toString('hex');

/**
 * Continua o trace que chegou (mesmo trace-id, novo span) ou inicia um novo. Quem chama no worker usa o
 * `traceparent` guardado no job: o mesmo trace-id liga o pedido HTTP, o job e os logs do processamento.
 */
export function continueTrace(incoming: string | null | undefined): TraceParent {
  const parent = parseTraceparent(incoming);
  return { traceId: parent?.traceId ?? randomBytes(16).toString('hex'), spanId: newSpanId(), flags: parent?.flags ?? '01' };
}

/** Id de requisição seguro para logs/cabeçalhos: aceita o do cliente só se tiver formato simples. */
export function sanitizeRequestId(incoming: string | null | undefined): string {
  const v = (incoming ?? '').trim();
  return /^[A-Za-z0-9_.:-]{8,64}$/.test(v) ? v : randomBytes(8).toString('hex');
}
