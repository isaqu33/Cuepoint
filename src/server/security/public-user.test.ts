import { describe, expect, it } from 'vitest';
import { toPublicUser } from './public-user';

describe('toPublicUser', () => {
  const full = {
    id: 'u1', email: 'a@b.c', name: 'Ana', isAdmin: true, isSystem: false, isBlocked: false,
    password: { id: 'p', hashed_password: '$argon2id$segredo', user_id: 'u1' },
    emailservice: { id: 'e', token: 'tok' },
    campoNovoSensivel: 'x',
  };

  it('remove hash de senha, credenciais de e-mail e campos desconhecidos', () => {
    const json = JSON.stringify(toPublicUser(full));
    expect(json).not.toContain('argon2');
    expect(json).not.toContain('hashed_password');
    expect(json).not.toContain('emailservice');
    expect(json).not.toContain('campoNovoSensivel');
  });

  it('mantém o que a interface usa', () => {
    expect(toPublicUser(full)).toMatchObject({ id: 'u1', name: 'Ana', isAdmin: true, isSystem: false });
  });

  it('null entra, null sai', () => {
    expect(toPublicUser(null)).toBeNull();
  });
});
