import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { registerNewPassword } from '$lib/server/password';
import { emit } from '../../../server/events/publish';
import { slugify, uniqueSlug } from '../../../server/workspace/slug';
import { prisma } from '../../../server/utils/db';
import type { RequestHandler } from './$types';

const MB = 1024 ** 2;
const limit = z.number().int().min(1).nullable().optional();

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  maxFiles: limit,
  maxStorageMB: limit,
  admin: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(200),
    password: z.string().min(8).max(200),
  }),
});

/** Lista os espaços de trabalho com o uso de cada um. Só o operador de plataforma (hooks). */
export const GET: RequestHandler = async () => {
  const [spaces, usage, members] = await Promise.all([
    prisma.workspace.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.mediaFile.groupBy({ by: ['workspaceId'], _count: true, _sum: { sizeBytes: true } }),
    prisma.user.groupBy({ by: ['workspaceId'], _count: true }),
  ]);
  const u = new Map(usage.map((x) => [x.workspaceId, x]));
  const m = new Map(members.map((x) => [x.workspaceId, x._count]));
  return json({
    workspaces: spaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      maxFiles: w.maxFiles,
      maxStorageBytes: w.maxStorageBytes === null ? null : Number(w.maxStorageBytes),
      files: u.get(w.id)?._count ?? 0,
      storageBytes: Number(u.get(w.id)?._sum.sizeBytes ?? 0),
      members: m.get(w.id) ?? 0,
      createdAt: w.createdAt.toISOString(),
    })),
  });
};

/** Cria um espaço de trabalho já com o primeiro administrador. Só o operador de plataforma (hooks). */
export const POST: RequestHandler = async ({ request, locals }) => {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return json({ error: `Dados inválidos: ${first.path.join('.')} — ${first.message}` }, { status: 400 });
  }
  const { name, maxFiles, maxStorageMB, admin } = parsed.data;

  if (await prisma.user.findFirst({ where: { email: admin.email } })) {
    return json({ error: 'Já existe uma conta com esse e-mail' }, { status: 409 });
  }
  const taken = new Set((await prisma.workspace.findMany({ select: { slug: true } })).map((w) => w.slug));
  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug: uniqueSlug(name, taken),
      maxFiles: maxFiles ?? null,
      maxStorageBytes: maxStorageMB ? BigInt(maxStorageMB) * BigInt(MB) : null,
    },
  });
  const user = await prisma.user.create({
    data: {
      email: admin.email,
      name: admin.name,
      username: slugify(admin.name),
      isAdmin: true,
      workspaceId: workspace.id,
      emailservice: { create: { isVerified: true, verifiedAt: new Date() } },
    },
  });
  await registerNewPassword(user.id, admin.password);
  await emit('identity.member.invited', user.id, { memberId: user.id, invitedByUserId: locals.user?.id }).catch(() => undefined);
  return json({ id: workspace.id, slug: workspace.slug, adminId: user.id }, { status: 201 });
};
