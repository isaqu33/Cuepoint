import { prisma } from '../utils/db';
import { ObjectStorageAdapter } from '../../utils/object-storage';
import { currentWorkspaceId } from '../workspace/context';
import { checkQuota } from '../workspace/quota';
import { UPLOAD_BUCKET, verifyUploadedObject } from '../uploads/verify';

export type NewMedia = { url: string; key: string; size: number; type: string; name: string };
export type ReplaceResult =
  | { ok: true; image?: NewMedia; audio?: NewMedia; growthBytes: number }
  | { ok: false; status: 413 | 422; message: string };

const bytesOf = (v: string | null | undefined) => Number(String(v ?? '').replace(/\D/g, '')) || 0;

/**
 * Edição com envio direto: confere os objetos novos no storage e a cota do espaço pelo CRESCIMENTO
 * (novo − antigo). Não altera nada: quem chama grava no banco e só então apaga os objetos antigos.
 */
export async function verifyReplacement(input: {
  lessonId: string;
  imageKey?: string | null;
  audioKey?: string | null;
  imageName?: string;
  audioName?: string;
}): Promise<ReplaceResult> {
  const lesson = await prisma.mediaFile.findUnique({ where: { id: input.lessonId }, select: { files: { orderBy: { createdAt: 'asc' }, select: { size: true } } } });
  const [oldImage, oldAudio] = [bytesOf(lesson?.files[0]?.size), bytesOf(lesson?.files[1]?.size)];
  const storage = new ObjectStorageAdapter(UPLOAD_BUCKET);
  const cleanup = async (...keys: (string | null | undefined)[]) =>
    void (await Promise.all(keys.filter(Boolean).map((k) => storage.deleteBlobIfExists(k as string))).catch(() => undefined));

  const out: { image?: NewMedia; audio?: NewMedia } = {};
  for (const [kind, key, name] of [['image', input.imageKey, input.imageName], ['audio', input.audioKey, input.audioName]] as const) {
    if (!key) continue;
    const v = await verifyUploadedObject(kind, key);
    if (!v.ok) {
      await cleanup(input.imageKey, input.audioKey);
      return { ok: false, status: 422, message: v.message };
    }
    out[kind] = { url: v.url, key: v.key, size: v.size, type: v.contentType, name: (name ?? v.key).slice(0, 200) };
  }

  const growthBytes = Math.max(0, (out.image ? out.image.size - oldImage : 0) + (out.audio ? out.audio.size - oldAudio : 0));
  const quota = await checkQuota(currentWorkspaceId(), { files: 0, bytes: growthBytes });
  if (!quota.ok) {
    await cleanup(input.imageKey, input.audioKey);
    return { ok: false, status: 413, message: quota.message };
  }
  return { ok: true, ...out, growthBytes };
}

/** Recalcula o tamanho total do arquivo a partir dos registros de File (usado pelos limites do espaço). */
export async function recomputeSizeBytes(lessonId: string): Promise<void> {
  const lesson = await prisma.mediaFile.findUnique({ where: { id: lessonId }, select: { files: { select: { size: true } } } });
  if (!lesson) return;
  const total = lesson.files.reduce((sum, f) => sum + bytesOf(f.size), 0);
  await prisma.mediaFile.update({ where: { id: lessonId }, data: { sizeBytes: BigInt(total) } });
}
