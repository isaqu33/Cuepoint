import { describe, expect, it } from 'vitest';
import { decideAccess } from './access';

const admin = { isAdmin: true };
const member = { isAdmin: false };
const run = (routeId: string | null, pathname: string, user: { isAdmin: boolean } | null) =>
  decideAccess({ routeId, pathname, user, hasSession: !!user });

describe('política de acesso', () => {
  it('rotas /[admin] exigem login e perfil de administrador', () => {
    expect(run('/[admin]/lessons', '/lessons', null)).toMatchObject({ allow: false, status: 401 });
    expect(run('/[admin]/lessons', '/lessons', member)).toMatchObject({ allow: false, status: 403 });
    expect(run('/[admin]/lessons', '/lessons', admin)).toEqual({ allow: true });
  });

  it('APIs administrativas bloqueiam anônimo e membro', () => {
    for (const p of [
      '/api/change-password-api-admin',
      '/api/delete-transcribed-audio',
      '/api/change-transcribed-audio',
      '/api/jobs/abc',
      '/api/lessons/x/transcription',
      '/api/batch/retry-failed',
      '/api/uploads',
      '/api/timeline/x',
      '/api/share/x',
      '/api/lessons/x/share',
    ]) {
      expect(run(null, p, null)).toMatchObject({ allow: false, status: 401 });
      expect(run(null, p, member)).toMatchObject({ allow: false, status: 403 });
      expect(run(null, p, admin)).toEqual({ allow: true });
    }
  });

  it('conta de sistema conta como administradora (igual ao layout do painel)', () => {
    expect(decideAccess({ routeId: '/[admin]/x', pathname: '/x', user: { isAdmin: null, isSystem: true }, hasSession: true })).toEqual({ allow: true });
  });

  it('APIs de conta exigem apenas sessão; /api desconhecida também (padrão seguro)', () => {
    for (const p of ['/api/chande-password-api', '/api/change-profile-api', '/api/qualquer-coisa']) {
      expect(run(null, p, null)).toMatchObject({ allow: false, status: 401 });
      expect(run(null, p, member)).toEqual({ allow: true });
    }
  });

  it('health é público e páginas fora do admin não são afetadas', () => {
    expect(run(null, '/api/health', null)).toEqual({ allow: true });
    expect(run('/auth/login', '/auth/login', null)).toEqual({ allow: true });
    expect(run('/app', '/app', member)).toEqual({ allow: true });
  });

  it('transcrições: qualquer membro lê, só administrador altera', () => {
    const at = (method: string, user: { isAdmin: boolean } | null) =>
      decideAccess({ routeId: null, pathname: '/api/transcriptions/x/export', method, user, hasSession: !!user });
    expect(at('GET', null)).toMatchObject({ allow: false, status: 401 });
    expect(at('GET', member)).toEqual({ allow: true });
    expect(at('PUT', member)).toMatchObject({ allow: false, status: 403 });
    expect(at('PUT', admin)).toEqual({ allow: true });
  });

  it('espaços de trabalho: só o operador de plataforma (conta de sistema)', () => {
    const sys = { isAdmin: false, isSystem: true } as never;
    for (const [routeId, pathname] of [['/[admin]/workspaces', '/workspaces'], [null, '/api/workspaces'], [null, '/api/metrics'], [null, '/api/batch/run'], [null, '/api/alerts'], [null, '/api/metrics/prometheus']] as const) {
      expect(decideAccess({ routeId, pathname, user: null, hasSession: false })).toMatchObject({ status: 401 });
      expect(decideAccess({ routeId, pathname, user: admin, hasSession: true })).toMatchObject({ allow: false, status: 403 });
      expect(decideAccess({ routeId, pathname, user: sys, hasSession: true })).toEqual({ allow: true });
    }
  });

  it('não confunde prefixos parecidos', () => {
    expect(run(null, '/api/metricsx', null)).toMatchObject({ status: 401 });
    expect(run(null, '/api/metricsx', member)).toEqual({ allow: true });
  });
});
