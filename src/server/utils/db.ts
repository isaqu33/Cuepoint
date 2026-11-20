import { PrismaClient } from '@prisma/client';
import { currentWorkspaceId } from '../workspace/context';
import { scopeArgs } from '../workspace/scope';

/**
 * Cliente único do banco. A extensão aplica o filtro de espaço de trabalho a TODA consulta dos modelos
 * escopados quando há contexto de espaço (requisição de usuário comum); ver `workspace/scope.ts`.
 * Consultas cruas (`$queryRaw`) não passam por aqui: use só em código de sistema.
 */
const base = new PrismaClient();

export const prisma = base.$extends({
  name: 'workspace-scope',
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        const workspaceId = currentWorkspaceId();
        if (!workspaceId) return query(args);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return query(scopeArgs(model, operation, args, workspaceId) as any);
      },
    },
  },
});
