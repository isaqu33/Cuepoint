import { redirect, type Handle } from '@sveltejs/kit';
import {
  validateSessionToken,
  setSessionTokenCookie,
  deleteSessionTokenCookie,
} from '$lib/server/auth';
import { decideAccess } from './server/security/access';
import { runWithContext } from './server/workspace/context';
import { log } from './server/observability/log';
import { continueTrace, formatTraceparent, sanitizeRequestId } from './server/observability/trace';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session') ?? null;
  if (token === null) {
    event.locals.user = null;
    event.locals.session = null;
  }

  const { session, user } = await validateSessionToken(token as string);
  if (session !== null) {
    setSessionTokenCookie(event, token as string, session.expiresAt);
  } else {
    deleteSessionTokenCookie(event);
  }

  event.locals.session = session;
  event.locals.user = user;

  const languageCookie = event.cookies.get('language');

  if (!languageCookie) {
    event.cookies.set('language', 'en-US', {
      maxAge: 31536000,
      path: '/',
    });
  }

  if (!session && event.route.id?.startsWith('/app')) {
    throw redirect(302, '/auth/login');
  }

  // Autorização central (ver src/server/security/access.ts): vale para páginas, actions e APIs.
  const access = decideAccess({
    routeId: event.route.id,
    pathname: event.url.pathname,
    user,
    hasSession: session !== null,
    method: event.request.method,
  });
  if (!access.allow) {
    const isApi = event.url.pathname.startsWith('/api/');
    const isForm = event.request.method !== 'GET' && event.request.method !== 'HEAD';
    if (access.status === 401 && !isApi && !isForm) throw redirect(302, '/auth/login');
    if (access.status === 403 && !isApi && !isForm) throw redirect(302, '/app');
    const error = access.status === 401 ? 'Não autenticado' : 'Apenas administradores';
    return new Response(JSON.stringify({ error }), {
      status: access.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (event.route.id == '/') {
    throw redirect(302, '/app');
  }

  if (event.route.id == '/auth/login' && session) {
    throw redirect(302, '/app');
  }

  // Contexto da requisição: espaço de trabalho (isolamento) + ids de correlação (logs, job e worker).
  // Usuário comum só enxerga o próprio espaço; o operador de plataforma (isSystem) e processos sem requisição
  // (worker, lotes) não são filtrados.
  const requestId = sanitizeRequestId(event.request.headers.get('x-request-id'));
  const trace = continueTrace(event.request.headers.get('traceparent'));
  const traceparent = formatTraceparent(trace);
  const workspaceId = user && !user.isSystem ? (user as { workspaceId?: string }).workspaceId : undefined;
  const started = Date.now();

  const response = await runWithContext({ workspaceId, requestId, traceparent }, () => resolve(event));
  try {
    response.headers.set('x-request-id', requestId);
    response.headers.set('traceparent', traceparent);
  } catch {
    /* resposta com cabeçalhos imutáveis (redirecionamentos internos): segue sem os ids */
  }
  const path = event.url.pathname;
  if (path !== '/api/health' && !path.startsWith('/_app/') && !path.startsWith('/@')) {
    log('info', 'requisição', { method: event.request.method, path, status: response.status, durationMs: Date.now() - started, userId: user?.id, requestId, traceparent, workspaceId });
  }
  return response;
};
