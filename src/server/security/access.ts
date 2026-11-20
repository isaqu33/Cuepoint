/**
 * Política de acesso por rota (função pura, testável). Aplicada em `hooks.server.ts`,
 * antes de qualquer load/action, para que nenhuma rota nova nasça sem proteção.
 *
 * - `/[admin]/**` e as APIs administrativas exigem usuário com `isAdmin`.
 * - APIs de conta exigem apenas sessão.
 * - `/api/health` é público (healthcheck do Docker).
 * - Qualquer outra `/api/*` não listada exige sessão (padrão seguro).
 */
export type AccessUser = { isAdmin?: boolean | null; isSystem?: boolean | null } | null;
export type AccessDecision =
  | { allow: true }
  | { allow: false; status: 401 | 403; reason: 'unauthenticated' | 'forbidden' };

const PUBLIC_API = new Set(['/api/health']);
/** Só o operador de plataforma (conta de sistema): gestão de espaços de trabalho. */
const SYSTEM_API = new Set(['/api/workspaces', '/api/metrics', '/api/batch/run', '/api/alerts']);
const ADMIN_API = new Set([
  '/api/jobs',
  '/api/lessons',
  '/api/batch',
  '/api/uploads',
  '/api/timeline',
  '/api/share',
  '/api/change-password-api-admin',
  '/api/delete-transcribed-audio',
  '/api/change-transcribed-audio',
]);

/** Rotas que qualquer membro logado pode LER, mas só administrador pode alterar. */
const ADMIN_WRITE_API = new Set(['/api/transcriptions']);

const ALLOW: AccessDecision = { allow: true };
const deny = (status: 401 | 403, reason: 'unauthenticated' | 'forbidden'): AccessDecision => ({
  allow: false,
  status,
  reason,
});

function matches(set: Set<string>, pathname: string): boolean {
  for (const base of set) if (pathname === base || pathname.startsWith(`${base}/`)) return true;
  return false;
}

export function decideAccess(input: {
  routeId: string | null | undefined;
  pathname: string;
  user: AccessUser;
  hasSession: boolean;
  method?: string;
}): AccessDecision {
  const { routeId, pathname, user, hasSession } = input;
  const method = (input.method ?? 'GET').toUpperCase();
  const isRead = method === 'GET' || method === 'HEAD';
  const isAdminRoute = !!routeId?.startsWith('/[admin]');
  const isApi = pathname === '/api' || pathname.startsWith('/api/');
  const isSystemRoute = !!routeId?.startsWith('/[admin]/workspaces') || (isApi && matches(SYSTEM_API, pathname));

  if (isApi && matches(PUBLIC_API, pathname)) return ALLOW;

  if (isSystemRoute) {
    if (!hasSession || !user) return deny(401, 'unauthenticated');
    return user.isSystem === true ? ALLOW : deny(403, 'forbidden');
  }

  if (isAdminRoute || (isApi && (matches(ADMIN_API, pathname) || (!isRead && matches(ADMIN_WRITE_API, pathname))))) {
    if (!hasSession || !user) return deny(401, 'unauthenticated');
    // Mesma regra do layout do painel: administrador ou conta de sistema.
    return user.isAdmin === true || user.isSystem === true ? ALLOW : deny(403, 'forbidden');
  }

  if (isApi) return hasSession && user ? ALLOW : deny(401, 'unauthenticated');

  return ALLOW;
}
