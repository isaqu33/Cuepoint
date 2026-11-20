import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../utils/db';
import { resolveShare } from './resolve';
import { generateToken, hashToken } from './token';

/** Integração com o banco: expiração e revogação são decididas no servidor, a cada acesso. */
const tag = `shr${Date.now()}`;
let fileId = '';
let userId = '';
const tokens: Record<string, string> = {};

async function link(name: string, expiresAt: Date, revokedAt: Date | null = null) {
  const token = generateToken();
  tokens[name] = token;
  await prisma.shareLink.create({ data: { tokenHash: hashToken(token), mediaFileId: fileId, workspaceId: 'ws_default', expiresAt, revokedAt } });
  return token;
}

beforeAll(async () => {
  userId = (await prisma.user.create({ data: { email: `${tag}@teste.local`, username: tag } })).id;
  fileId = (await prisma.mediaFile.create({ data: { title: `Arquivo ${tag}`, userid: userId } })).id;
});
afterAll(async () => {
  await prisma.shareLink.deleteMany({ where: { mediaFileId: fileId } });
  await prisma.mediaFile.deleteMany({ where: { title: { contains: tag } } });
  await prisma.user.deleteMany({ where: { email: `${tag}@teste.local` } });
});

describe('resolveShare (banco real)', () => {
  it('link válido resolve para o arquivo', async () => {
    const t = await link('ok', new Date(Date.now() + 3_600_000));
    expect(await resolveShare(t)).toMatchObject({ ok: true, lessonId: fileId });
  });
  it('link expirado é 410', async () => {
    const t = await link('expirado', new Date(Date.now() - 1000));
    expect(await resolveShare(t)).toEqual({ ok: false, status: 410, message: 'Este link expirou' });
  });
  it('link revogado é 410, mesmo dentro da validade', async () => {
    const t = await link('revogado', new Date(Date.now() + 3_600_000), new Date());
    expect(await resolveShare(t)).toEqual({ ok: false, status: 410, message: 'Este link foi desativado' });
  });
  it('a validade é conferida a cada chamada (passa de válido a expirado sem novo cadastro)', async () => {
    const t = await link('limite', new Date(Date.now() + 3_600_000));
    expect((await resolveShare(t)).ok).toBe(true);
    expect(await resolveShare(t, new Date(Date.now() + 2 * 3_600_000))).toMatchObject({ ok: false, status: 410 });
  });
  it('token desconhecido ou malformado é 404 e não consulta como filtro livre', async () => {
    expect(await resolveShare(generateToken())).toMatchObject({ ok: false, status: 404 });
    expect(await resolveShare("' OR 1=1 --")).toMatchObject({ ok: false, status: 404 });
  });
  it('o banco guarda só o hash, nunca o token', async () => {
    const stored = await prisma.shareLink.findMany({ where: { mediaFileId: fileId } });
    for (const l of stored) expect(Object.values(tokens)).not.toContain(l.tokenHash);
  });
});
