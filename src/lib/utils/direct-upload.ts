import { runPool } from './batch-upload';

/** Acima disto, mídia grande vai em partes (multipart); abaixo, um PUT único. Deve casar com o servidor. */
export const MULTIPART_THRESHOLD = 64 * 1024 ** 2;
const PART_CONCURRENCY = 3;
const PART_RETRIES = 3;

type Progress = ((percent: number) => void) | undefined;

/** PUT de um blob com progresso; devolve o ETag da resposta (necessário para concluir envio em partes). */
function putBlob(url: string, body: Blob, contentType: string | null, onBytes?: (loaded: number) => void): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    if (contentType) xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onBytes?.(e.loaded);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.getResponseHeader('ETag')) : reject(new Error('O envio do arquivo falhou'));
    xhr.onerror = () => reject(new Error('Sem conexão com o armazenamento'));
    xhr.send(body);
  });
}

async function json(res: Response) {
  return res.json().catch(() => ({}));
}

/** Envio em partes: paralelo, com repetição por parte e progresso agregado. Cancela no storage se falhar. */
async function uploadMultipart(file: File, onProgress: Progress): Promise<string> {
  const res = await fetch('/api/uploads/multipart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'audio', contentType: file.type, size: file.size }),
  });
  const plan = await json(res);
  if (!res.ok) throw new Error(plan.error ?? 'Não foi possível preparar o envio');

  const loaded = new Map<number, number>();
  const report = () => onProgress?.(Math.min(99, Math.round(([...loaded.values()].reduce((a, b) => a + b, 0) / file.size) * 100)));
  const etags: { partNumber: number; etag: string }[] = [];
  let failure: Error | null = null;

  await runPool(plan.parts as { partNumber: number; url: string }[], PART_CONCURRENCY, async ({ partNumber, url }) => {
    if (failure) return;
    const start = (partNumber - 1) * plan.partSize;
    const blob = file.slice(start, Math.min(file.size, start + plan.partSize));
    for (let attempt = 1; ; attempt++) {
      try {
        const etag = await putBlob(url, blob, null, (n) => (loaded.set(partNumber, n), report()));
        if (!etag) throw new Error('O armazenamento não devolveu o ETag da parte (verifique o CORS)');
        loaded.set(partNumber, blob.size);
        report();
        etags.push({ partNumber, etag });
        return;
      } catch (err) {
        if (attempt >= PART_RETRIES) {
          failure = err as Error;
          throw err;
        }
        loaded.set(partNumber, 0);
      }
    }
  });

  if (failure || etags.length !== plan.parts.length) {
    await fetch('/api/uploads/multipart/abort', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: plan.key, uploadId: plan.uploadId }),
    }).catch(() => undefined);
    throw failure ?? new Error('O envio do arquivo falhou');
  }

  const done = await fetch('/api/uploads/multipart/complete', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: plan.key, uploadId: plan.uploadId, parts: etags }),
  });
  if (!done.ok) throw new Error((await json(done)).error ?? 'Não foi possível concluir o envio');
  onProgress?.(100);
  return plan.key as string;
}

/**
 * Envia um arquivo DIRETO ao storage (o servidor web não recebe os bytes) e devolve a chave.
 * Mídia grande usa envio em partes; o resto, um PUT por URL pré-assinada. `onProgress` recebe 0–100.
 * Lança Error com mensagem em português.
 */
export async function uploadDirect(kind: 'audio' | 'image', file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (kind === 'audio' && file.size > MULTIPART_THRESHOLD) return uploadMultipart(file, onProgress);

  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
  });
  const plan = await json(res);
  if (!res.ok) throw new Error(plan.error ?? 'Não foi possível preparar o envio');
  await putBlob(plan.uploadUrl, file, plan.headers['Content-Type'], (n) => onProgress?.(Math.round((n / file.size) * 100)));
  return plan.key as string;
}
