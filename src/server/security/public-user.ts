/**
 * Dados do usuário que podem ir ao navegador. Lista de PERMISSÃO (não de bloqueio): campo novo no
 * banco nunca vaza por padrão. Hash de senha, tokens e credenciais de e-mail jamais saem do servidor.
 */
const PUBLIC_FIELDS = ['id', 'email', 'username', 'name', 'isAdmin', 'isSystem', 'isBlocked', 'groupId'] as const;

export type PublicUser = Partial<Record<(typeof PUBLIC_FIELDS)[number], unknown>>;

export function toPublicUser(user: Record<string, unknown> | null | undefined): PublicUser | null {
  if (!user) return null;
  const out: PublicUser = {};
  for (const f of PUBLIC_FIELDS) if (f in user) out[f] = user[f];
  return out;
}
