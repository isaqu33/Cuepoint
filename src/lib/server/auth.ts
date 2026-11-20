import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { createSession as createSessionPrisma } from '../../server/services/session/create';
import { findSession } from '../../server/services/session/find';
import { deleteSession } from '../../server/services/session/delete';
import { updateSession } from '../../server/services/session/update';
import type { RequestEvent } from '@sveltejs/kit';

import type { User, Session } from '@prisma/client';

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

export async function createSession(token: string, user_id: string): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    user_id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    createdAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    updatedAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  };
  await createSessionPrisma(session);
  return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await findSession(sessionId);

  if (result === null) {
    return { session: null, user: null };
  }

  const { user, ...session } = result;

  if (Date.now() >= session.expiresAt.getTime()) {
    await deleteSession(sessionId);
    return { session: null, user: null };
  }

  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await updateSession({ id: session.id, expiresAt: session.expiresAt });
  }
  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await deleteSession(sessionId);
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
  event.cookies.set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    // Seguro só sob HTTPS: em HTTP (Docker/rede local) o navegador descartaria o cookie.
    secure: event.url.protocol === 'https:',
    expires: expiresAt,
    path: '/',
  });
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
  event.cookies.set('session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: event.url.protocol === 'https:',
    maxAge: 0,
    path: '/',
  });
}
