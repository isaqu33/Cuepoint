import { currentContext } from '../workspace/context';
import { parseTraceparent } from './trace';

export type Level = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Uma linha JSON por evento de log, com os ids de correlação da requisição/job atual. Função pura de formatação. */
export function formatLog(level: Level, msg: string, fields: Record<string, unknown>, ctx: { requestId?: string; traceparent?: string; workspaceId?: string }, now = new Date()): string {
  const trace = parseTraceparent(fields.traceparent as string | undefined ?? ctx.traceparent);
  const { traceparent: _omit, ...rest } = fields;
  void _omit;
  return JSON.stringify({
    ts: now.toISOString(),
    level,
    msg,
    requestId: ctx.requestId,
    traceId: trace?.traceId,
    workspaceId: ctx.workspaceId,
    ...rest,
  });
}

const threshold = () => ORDER[(process.env.LOG_LEVEL as Level) in ORDER ? (process.env.LOG_LEVEL as Level) : 'info'];

export function log(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  if (ORDER[level] < threshold()) return;
  const line = formatLog(level, msg, fields, currentContext());
  (level === 'error' || level === 'warn' ? console.error : console.log)(line);
}
