import { describe, expect, it } from 'vitest';
import { formatLog } from './log';
import { continueTrace, formatTraceparent, parseTraceparent, sanitizeRequestId } from './trace';

const TP = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';

describe('traceparent (W3C / OpenTelemetry)', () => {
  it('lê e escreve o formato padrão sem perdas', () => {
    const p = parseTraceparent(TP)!;
    expect(p.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
    expect(formatTraceparent(p)).toBe(TP);
  });
  it('recusa lixo, ids zerados e versão desconhecida', () => {
    for (const bad of ['', 'abc', `00-${'0'.repeat(32)}-b7ad6b7169203331-01`, `00-0af7651916cd43dd8448eb211c80319c-${'0'.repeat(16)}-01`, `01-${TP.slice(3)}`, null, undefined]) {
      expect(parseTraceparent(bad as string)).toBeNull();
    }
  });
  it('continua o trace recebido (mesmo trace-id, novo span) ou começa um novo', () => {
    const next = continueTrace(TP);
    expect(next.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
    expect(next.spanId).not.toBe('b7ad6b7169203331');
    const fresh = continueTrace(undefined);
    expect(fresh.traceId).toMatch(/^[0-9a-f]{32}$/);
  });
  it('id de requisição do cliente só vale se for simples; senão gera outro', () => {
    expect(sanitizeRequestId('abc-1234_XYZ')).toBe('abc-1234_XYZ');
    expect(sanitizeRequestId('<script>')).toMatch(/^[0-9a-f]{16}$/);
    expect(sanitizeRequestId(undefined)).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('log estruturado', () => {
  it('uma linha JSON com os ids de correlação', () => {
    const line = formatLog('info', 'job concluído', { jobId: 'j1', durationMs: 5 }, { requestId: 'req-12345678', traceparent: TP, workspaceId: 'ws_a' }, new Date('2026-11-18T10:00:00Z'));
    expect(JSON.parse(line)).toEqual({
      ts: '2026-11-18T10:00:00.000Z', level: 'info', msg: 'job concluído', requestId: 'req-12345678',
      traceId: '0af7651916cd43dd8448eb211c80319c', workspaceId: 'ws_a', jobId: 'j1', durationMs: 5,
    });
  });
  it('o traceparent do próprio job (worker) tem prioridade e não vaza como campo solto', () => {
    const line = JSON.parse(formatLog('info', 'x', { traceparent: TP }, {}));
    expect(line.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
    expect(line.traceparent).toBeUndefined();
  });
});
