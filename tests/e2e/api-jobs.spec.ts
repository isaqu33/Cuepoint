import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';

/** 1,5 s de silêncio em WAV 16 kHz mono: válido para o FFmpeg e para o whisper. */
function silentWav(seconds = 1.5): Buffer {
  const rate = 16000;
  const data = Buffer.alloc(Math.floor(rate * seconds) * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const created: string[] = [];

/** Exclui pelo mesmo endpoint do painel (apaga também os objetos do storage). */
async function deleteLesson(page: Page, id: string) {
  const origin = new URL(page.url()).origin;
  await page.request.post('/admin/lessons?/deleteAction', { form: { id }, headers: { origin } });
}

/** Cria um arquivo com áudio pelo painel e devolve o id (lido do endereço do painel de edição). */
async function createLesson(page: Page, title: string, audio?: { name: string; buffer: Buffer }): Promise<string> {
  await page.goto('/admin/lessons');
  await page.getByRole('button', { name: 'Novo arquivo' }).first().click();
  const handle = await page.locator('iframe[title="Novo arquivo"]').elementHandle();
  await (await handle!.contentFrame())!.waitForLoadState('networkidle');
  const form = page.frameLocator('iframe[title="Novo arquivo"]');
  await form.locator('#Title').fill(title);
  await form.locator('#description').fill('Arquivo criado pelo teste de API');
  await form.locator('#photo').setInputFiles(path.join(__dirname, 'fixtures/pixel.png'));
  await form.locator('#audio').setInputFiles({ name: audio?.name ?? 'silencio.wav', mimeType: 'audio/wav', buffer: audio?.buffer ?? silentWav() });
  await form.getByRole('button', { name: 'Criar', exact: true }).click();
  const row = page.locator('tbody tr', { hasText: title });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /Editar/ }).first().click();
  const src = await page.locator('iframe[src*="/admin/lessons/update/"]').getAttribute('src');
  const id = /\/update\/([^/?]+)/.exec(src ?? '')?.[1];
  expect(id, 'id do arquivo no painel de edição').toBeTruthy();
  created.push(id!);
  return id!;
}

test.describe('API: autorização, jobs, idempotência e SSE', () => {
  test.setTimeout(150_000);

  // Não deixa arquivos de teste para trás: eles empurrariam os dados de demonstração para fora da Biblioteca.
  test.afterEach(async ({ page }) => {
    for (const id of created.splice(0)) await deleteLesson(page, id).catch(() => undefined);
  });

  test('anônimo é barrado em todas as APIs administrativas', async ({ request }) => {
    for (const [method, url] of [
      ['GET', '/api/metrics'],
      ['GET', '/api/jobs/qualquer'],
      ['GET', '/api/jobs/qualquer/events'],
      ['POST', '/api/lessons/qualquer/transcription'],
      ['POST', '/api/batch/run?job=reconcile'],
      ['POST', '/api/batch/retry-failed'],
      ['POST', '/api/change-password-api-admin'],
      ['POST', '/api/delete-transcribed-audio'],
      ['POST', '/api/change-transcribed-audio'],
    ] as const) {
      const res = await request.fetch(url, { method, ...(method === 'POST' ? { data: {} } : {}), maxRedirects: 0 });
      expect(res.status(), `${method} ${url}`).toBe(401);
    }
    expect((await request.get('/api/health')).status()).toBe(200);
  });

  test('dados do layout não carregam hash de senha nem credenciais', async ({ page }) => {
    await loginAsAdmin(page);
    for (const url of ['/app/__data.json', '/admin/lessons/__data.json']) {
      const body = await (await page.request.get(url)).text();
      expect(body, url).not.toMatch(/hashed_password|argon2/);
    }
  });

  test('202 + Location, estado persistido, idempotência e SSE com retomada', async ({ page }) => {
    await loginAsAdmin(page);
    const id = await createLesson(page, `API E2E ${Date.now()}`);

    expect((await page.request.get('/api/jobs/inexistente')).status()).toBe(404);

    // Pedido com Idempotency-Key: 202 e Location apontando para o estado do job.
    const key = `e2e-${Date.now()}-abcdef`;
    const first = await page.request.post(`/api/lessons/${id}/transcription`, { headers: { 'Idempotency-Key': key } });
    expect(first.status()).toBe(202);
    expect(first.headers()['location']).toBe(`/api/jobs/${id}`);
    const firstBody = await first.json();
    expect(firstBody.enqueued).toBe(true);

    // Mesma chave e mesmo pedido: mesma resposta, sem criar trabalho de novo.
    const replay = await page.request.post(`/api/lessons/${id}/transcription`, { headers: { 'Idempotency-Key': key } });
    expect(replay.status()).toBe(202);
    expect(replay.headers()['idempotent-replayed']).toBe('true');
    expect(await replay.json()).toEqual(firstBody);

    // Mesma chave em outro pedido: conflito. Chave inválida: 400.
    expect((await page.request.post('/api/lessons/outro/transcription', { headers: { 'Idempotency-Key': key } })).status()).toBe(422);
    expect((await page.request.post(`/api/lessons/${id}/transcription`, { headers: { 'Idempotency-Key': 'x' } })).status()).toBe(400);

    // Estado persistido disponível a qualquer momento (retomada após recarregar).
    const job = await (await page.request.get(location(first))).json();
    expect(['QUEUED', 'PROCESSING', 'READY']).toContain(job.status);

    // SSE: abre no meio do processamento; o 1º quadro é o snapshot persistido e o fluxo termina sozinho.
    await page.goto('/admin/processing');
    const events = await page.evaluate(
      (jobId) =>
        new Promise<{ names: string[]; last: string }>((resolve, reject) => {
          const names: string[] = [];
          let last = '';
          const es = new EventSource(`/api/jobs/${jobId}/events`);
          const done = () => (es.close(), resolve({ names, last }));
          const timer = setTimeout(() => (es.close(), reject(new Error('SSE não terminou'))), 90_000);
          for (const name of ['snapshot', 'progress', 'status']) {
            es.addEventListener(name, (e) => {
              names.push(name);
              const d = JSON.parse((e as MessageEvent).data);
              last = d.status ?? last;
              if (d.terminal || d.status === 'READY' || d.status === 'FAILED') (clearTimeout(timer), done());
            });
          }
          es.onerror = () => {
            if (es.readyState === EventSource.CLOSED) (clearTimeout(timer), done());
          };
        }),
      id,
    );
    expect(events.names[0]).toBe('snapshot');
    expect(['READY', 'FAILED']).toContain(events.last);
  });

  test('streaming: cues chegam ao vivo e quem entra no meio recebe os já prontos', async ({ page }) => {
    await loginAsAdmin(page);
    const id = await createLesson(page, `Cues E2E ${Date.now()}`, {
      name: 'fala.wav',
      buffer: readFileSync(path.join(__dirname, 'fixtures/fala.wav')),
    });
    await page.goto('/admin/processing');
    expect((await page.request.post(`/api/lessons/${id}/transcription`)).status()).toBe(202);

    const result = await page.evaluate(
      (jobId) =>
        new Promise<{ live: { index: number; text: string }[]; lateSnapshotCues: number; final: string }>((resolve, reject) => {
          const live: { index: number; text: string }[] = [];
          let lateSnapshotCues = -1;
          let final = '';
          const timer = setTimeout(() => reject(new Error('SSE não terminou')), 100_000);
          const es = new EventSource(`/api/jobs/${jobId}/events`);
          es.addEventListener('cue', (e) => {
            live.push(JSON.parse((e as MessageEvent).data));
            // Primeiro trecho recebido: abre um SEGUNDO leitor, que chega depois e precisa ver o que já saiu.
            if (live.length === 1 && lateSnapshotCues === -1) {
              lateSnapshotCues = -2;
              const late = new EventSource(`/api/jobs/${jobId}/events`);
              late.addEventListener('snapshot', (ev) => {
                lateSnapshotCues = (JSON.parse((ev as MessageEvent).data).cues ?? []).length;
                late.close();
              });
            }
          });
          es.addEventListener('status', (e) => {
            const d = JSON.parse((e as MessageEvent).data);
            if (d.status === 'READY' || d.status === 'FAILED') {
              final = d.status;
              clearTimeout(timer);
              es.close();
              setTimeout(() => resolve({ live, lateSnapshotCues, final }), 500);
            }
          });
        }),
      id,
    );
    expect(result.final).toBe('READY');
    expect(result.live.length).toBeGreaterThan(0);
    expect(result.live.map((c) => c.index)).toEqual(result.live.map((_, i) => i)); // ordem e sem repetição
    expect(result.lateSnapshotCues).toBeGreaterThanOrEqual(1);
  });

  test('upload direto: valida tipo e tamanho, assina a URL e o storage recusa chave adulterada', async ({ page }) => {
    await loginAsAdmin(page);
    const plan = (data: object) => page.request.post('/api/uploads', { data });
    expect((await plan({ kind: 'audio', contentType: 'text/html', size: 10 })).status()).toBe(415);
    expect((await plan({ kind: 'audio', contentType: 'audio/wav', size: 0 })).status()).toBe(400);
    expect((await plan({ kind: 'image', contentType: 'image/png', size: 50 * 1024 ** 2 })).status()).toBe(413);
    expect((await plan({ kind: 'video', contentType: 'video/mp4', size: 10 })).status()).toBe(400);

    const ok = await plan({ kind: 'audio', contentType: 'audio/wav', size: 100 });
    expect(ok.status()).toBe(200);
    const body = await ok.json();
    expect(body.key).toMatch(/^audio_[0-9a-f-]{36}\.wav$/);
    expect(body.uploadUrl).toContain('X-Amz-Signature=');

    // O navegador (com CORS) envia direto ao storage; chave diferente da assinada é recusada.
    const result = await page.evaluate(
      async ({ url, key }) => {
        const put = (u: string) => fetch(u, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: new Blob(['x'.repeat(100)]) }).then((r) => r.status);
        return { good: await put(url), forged: await put(url.replace(key, 'audio_00000000-0000-0000-0000-000000000000.wav')) };
      },
      { url: body.uploadUrl as string, key: body.key as string },
    );
    expect(result.good).toBe(200);
    expect(result.forged).toBe(403);
  });

  test('batch: reconciliação manual e reprocesso em lote respondem e registram a execução', async ({ page }) => {
    await loginAsAdmin(page);
    const run = await page.request.post('/api/batch/run?job=reconcile');
    expect(run.status()).toBe(200);
    expect((await run.json()).status).toBe('OK');
    expect((await page.request.post('/api/batch/run?job=invalido')).status()).toBe(400);

    const retry = await page.request.post('/api/batch/retry-failed');
    expect(retry.status()).toBe(202);
    expect(await retry.json()).toEqual(expect.objectContaining({ selected: expect.any(Number), remaining: expect.any(Number) }));
  });
});

const location = (res: { headers(): Record<string, string> }) => res.headers()['location'];
