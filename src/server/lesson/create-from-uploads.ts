import { createlessonbyid } from '../services/lesson/create-lesson';
import { getLessontoEditByTitle } from '../services/lesson/verify-title-exits';
import { emit } from '../events/publish';
import { checkQuota } from '../workspace/quota';
import { currentWorkspaceId } from '../workspace/context';
import { ObjectStorageAdapter } from '../../utils/object-storage';
import { UPLOAD_BUCKET } from '../uploads/verify';
import { verifyUploadedObject } from '../uploads/verify';

export type CreateFromUploads = {
  userId: string;
  title: string;
  description: string;
  imageKey: unknown;
  audioKey: unknown;
  imageName?: string;
  audioName?: string;
};
export type CreateResult =
  | { ok: true; id: string }
  | { ok: false; status: 400 | 409 | 413 | 422 | 500; message: string };

/**
 * Cria um arquivo a partir de objetos que o navegador JÁ enviou ao storage (URL pré-assinada).
 * Confere título, chaves e objetos no servidor; a URL salva vem do storage, nunca do cliente.
 * Usado pelo formulário "Novo arquivo" e pelo envio em lote.
 */
export async function createLessonFromUploads(input: CreateFromUploads): Promise<CreateResult> {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) return { ok: false, status: 400, message: 'O título é obrigatório' };
  if (!description) return { ok: false, status: 400, message: 'A descrição é obrigatória' };
  if (await getLessontoEditByTitle(title)) {
    return { ok: false, status: 409, message: 'Já existe um item com esse título. Escolha outro.' };
  }

  const [img, aud] = await Promise.all([
    verifyUploadedObject('image', input.imageKey),
    verifyUploadedObject('audio', input.audioKey),
  ]);
  if (!img.ok) return { ok: false, status: 422, message: img.message };
  if (!aud.ok) return { ok: false, status: 422, message: aud.message };

  // Limites do espaço (arquivos e armazenamento). Excedeu: não cria e libera os objetos já enviados.
  const quota = await checkQuota(currentWorkspaceId(), { files: 1, bytes: img.size + aud.size });
  if (!quota.ok) {
    const storage = new ObjectStorageAdapter(UPLOAD_BUCKET);
    await Promise.all([storage.deleteBlobIfExists(img.key), storage.deleteBlobIfExists(aud.key)]).catch(() => undefined);
    return { ok: false, status: 413, message: quota.message };
  }

  const clip = (v: string | undefined, fallback: string) => (v ?? fallback).slice(0, 200);
  const created = await createlessonbyid(input.userId, title, description, img.url, aud.url, [
    { size: String(img.size), type: img.contentType, name: clip(input.imageName, img.key), lastModified: String(Date.now()), path: img.url },
    { size: String(aud.size), type: aud.contentType, name: clip(input.audioName, aud.key), lastModified: String(Date.now()), path: aud.url },
  ], img.size + aud.size);
  if (created) {
    await emit('media.file.uploaded', created.id, { lessonId: created.id, userId: input.userId, audioBytes: aud.size }).catch(() => undefined);
    return { ok: true, id: created.id };
  }
  return { ok: false, status: 500, message: 'Não foi possível concluir a ação' };
}
