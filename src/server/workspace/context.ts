import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contexto da requisição atual: espaço de trabalho (isolamento) e ids de correlação (observabilidade).
 * Definido em `hooks.server.ts`; sem contexto (worker, rotinas em lote) as consultas não são filtradas.
 */
export interface RequestContext {
  workspaceId?: string;
  requestId?: string;
  /** W3C traceparent desta requisição (`00-<trace-id>-<span-id>-01`). */
  traceparent?: string;
}

const store = new AsyncLocalStorage<RequestContext>();

export const DEFAULT_WORKSPACE_ID = 'ws_default';
export const currentContext = (): RequestContext => store.getStore() ?? {};
export const currentWorkspaceId = (): string | null => store.getStore()?.workspaceId ?? null;

/**
 * Executa `fn` dentro do contexto. O `await` interno é essencial: promessas do Prisma são preguiçosas
 * (só consultam o banco quando alguém espera por elas); sem ele, uma `fn` que devolve a promessa sem esperar
 * a executaria DEPOIS de sair do contexto, sem o filtro do espaço.
 */
export const runWithContext = <T>(ctx: RequestContext, fn: () => T | Promise<T>): Promise<T> =>
  store.run(ctx, async () => await fn());

/** Atalho: só o espaço de trabalho (mantém os ids de correlação do contexto atual, se houver). */
export const runInWorkspace = <T>(workspaceId: string, fn: () => T | Promise<T>): Promise<T> =>
  runWithContext({ ...currentContext(), workspaceId }, fn);
