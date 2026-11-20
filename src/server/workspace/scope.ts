/**
 * Regras puras que prendem uma consulta do Prisma a um espaço de trabalho. A extensão em `utils/db.ts` só chama
 * esta função: tudo que decide o isolamento está aqui, testável sem banco.
 *
 * Limite conhecido: filtra o modelo consultado, não os modelos relacionados trazidos por `include`. Esses
 * seguem a relação (um registro só se relaciona com outros do mesmo espaço quando foi criado dentro dele).
 */
export const SCOPED_MODELS: ReadonlySet<string> = new Set(['User', 'Collection', 'Subcollection', 'MediaFile', 'EventLog']);

const WHERE_OPS = new Set(['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy', 'updateMany', 'deleteMany']);
const UNIQUE_OPS = new Set(['findUnique', 'findUniqueOrThrow', 'update', 'delete']);

type Args = Record<string, unknown> & { where?: Record<string, unknown>; data?: unknown; create?: unknown };

const withWorkspace = (data: unknown, workspaceId: string): unknown => {
  if (!data || typeof data !== 'object') return data;
  const d = data as Record<string, unknown>;
  return 'workspaceId' in d || 'workspace' in d ? d : { ...d, workspaceId };
};

export function scopeArgs(model: string, operation: string, args: unknown, workspaceId: string): unknown {
  if (!SCOPED_MODELS.has(model)) return args;
  const a: Args = { ...((args as Args) ?? {}) };

  if (WHERE_OPS.has(operation)) {
    a.where = a.where ? { AND: [a.where, { workspaceId }] } : { workspaceId };
    return a;
  }
  if (UNIQUE_OPS.has(operation)) {
    a.where = { ...(a.where ?? {}), workspaceId };
    return a;
  }
  if (operation === 'upsert') {
    a.where = { ...(a.where ?? {}), workspaceId };
    a.create = withWorkspace(a.create, workspaceId);
    return a;
  }
  if (operation === 'create') {
    a.data = withWorkspace(a.data, workspaceId);
    return a;
  }
  if (operation === 'createMany') {
    a.data = Array.isArray(a.data) ? a.data.map((d) => withWorkspace(d, workspaceId)) : withWorkspace(a.data, workspaceId);
    return a;
  }
  return a;
}
