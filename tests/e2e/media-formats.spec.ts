import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const fixture = (n: string) => readFileSync(path.join(__dirname, 'fixtures', n));
const created: string[] = [];

/** PUT direto ao storage feito pelo NAVEGADOR (o storage só é alcançável por ele no E2E; também prova o CORS). */
async function putFromBrowser(page: Page, url: string, type: string, body: Buffer) {
  return page.evaluate(
    async ({ url, type, b64 }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return (await fetch(url, { method: 'PUT', headers: { 'Content-Type': type }, body: bytes })).status;
    },
    { url, type, b64: body.toString('base64') },
  );
}

async function createViaApi(page: Page, title: string, media: { name: string; type: string; body: Buffer }) {
  const key = async (kind: 'audio' | 'image', type: string, body: Buffer) => {
    const plan = await (await page.request.post('/api/uploads', { data: { kind, contentType: type, size: body.length } })).json();
    expect(await putFromBrowser(page, plan.uploadUrl, type, body)).toBe(200);
    return plan.key as string;
  };
  const res = await page.request.post('/api/lessons', {
    data: {
      title, description: 'Teste de formatos', audioName: media.name, imageName: 'pixel.png',
      audioKey: await key('audio', media.type, media.body), imageKey: await key('image', 'image/png', fixture('pixel.png')),
    },
  });
  expect(res.status()).toBe(201);
  const id = (await res.json()).id as string;
  created.push(id);
  return id;
}

test.describe('Formatos de mídia, envio em partes e edição', () => {
  test.setTimeout(180_000);

  test.afterEach(async ({ page }) => {
    const origin = new URL(page.url()).origin;
    for (const id of created.splice(0)) await page.request.post('/admin/lessons?/deleteAction', { form: { id }, headers: { origin } }).catch(() => undefined);
  });

  test('vídeo: envia MP4, extrai o áudio para transcrever e a revisão mostra o player de vídeo', async ({ page }) => {
    await loginAsAdmin(page);
    const title = `Vídeo E2E ${Date.now()}`;
    const id = await createViaApi(page, title, { name: 'fala.mp4', type: 'video/mp4', body: fixture('fala.mp4') });

    expect((await page.request.post(`/api/lessons/${id}/transcription`)).status()).toBe(202);
    await expect
      .poll(async () => (await (await page.request.get(`/api/jobs/${id}`)).json()).status, { timeout: 120_000, intervals: [1000] })
      .toBe('READY');

    await page.goto(`/app/lesson/${id}`);
    await expect(page.getByTestId('player-video')).toBeVisible();
    await expect(page.locator('button.cue').first()).toBeVisible(); // a transcrição saiu do áudio do vídeo
    const src = await page.getByTestId('player-video').getAttribute('src');
    expect(src).toMatch(/\.mp4$/);

    // Clicar num trecho leva o vídeo àquele momento (o ticker usa o <video> como player).
    await page.locator('button.cue').nth(1).click().catch(() => undefined);
    await expect.poll(() => page.getByTestId('player-video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThanOrEqual(0);
  });

  test('envio em partes: um arquivo de 70 MB sobe em partes pelo envio em lote e vira arquivo', async ({ page }) => {
    await loginAsAdmin(page);
    const stamp = Date.now();
    const calls: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.pathname.startsWith('/api/uploads/multipart') || (u.port === '9000' && u.searchParams.has('partNumber'))) calls.push(`${r.method()} ${u.pathname}${u.searchParams.get('partNumber') ? '#' + u.searchParams.get('partNumber') : ''}`);
    });

    await page.goto('/admin/lessons');
    await page.getByRole('button', { name: 'Envio em lote' }).click();
    const panel = page.frameLocator('iframe[title="Envio em lote"]');
    await expect(panel.getByText('Arraste os arquivos aqui')).toBeVisible({ timeout: 30_000 });
    await (await (await page.locator('iframe[title="Envio em lote"]').elementHandle())!.contentFrame())!.waitForLoadState('networkidle');

    page.on('response', async (r) => {
      if (r.url().endsWith('/api/lessons') && r.request().method() === 'POST' && r.status() === 201) created.push((await r.json()).id);
    });
    const big = path.join(os.tmpdir(), `Grande-${stamp}.wav`); // o Playwright não aceita buffer > 50 MB: vai por caminho
    writeFileSync(big, Buffer.alloc(70 * 1024 * 1024, 1));
    const usageBefore = async () => (await (await page.request.get('/api/workspaces')).json()).workspaces.find((w: { id: string }) => w.id === 'ws_default').storageBytes as number;
    const before = await usageBefore();
    await panel.locator('#batch-audio').setInputFiles(big);
    await panel.locator('#batch-cover').setInputFiles(path.join(__dirname, 'fixtures/pixel.png'));
    await panel.getByLabel(/Pedir a transcrição/).uncheck(); // 70 MB de dados sintéticos: só o envio importa aqui
    await panel.getByRole('button', { name: /Enviar 1 arquivo/ }).click();
    await expect(panel.getByTestId('resumo-lote')).toContainText('1 de 1 arquivo(s) enviado(s)', { timeout: 150_000 });

    // Foi por partes: iniciou, enviou 5 partes (16 MiB) direto ao storage e concluiu.
    expect(calls).toContain('POST /api/uploads/multipart');
    expect(calls.filter((c) => c.startsWith('PUT') && c.includes('#'))).toHaveLength(5);
    expect(calls).toContain('POST /api/uploads/multipart/complete');

    // O tamanho registrado vem do storage (objeto montado), não do cliente: cresceu pelo menos 70 MB.
    rmSync(big, { force: true });
    expect(created).toHaveLength(1);
    expect((await usageBefore()) - before).toBeGreaterThanOrEqual(70 * 1024 * 1024);
  });

  test('edição: trocar a capa envia direto ao storage e substitui a imagem', async ({ page }) => {
    await loginAsAdmin(page);
    const title = `Edição E2E ${Date.now()}`;
    const id = await createViaApi(page, title, { name: 'fala.wav', type: 'audio/wav', body: fixture('fala.wav') });

    await page.goto('/admin/lessons');
    await page.waitForLoadState('networkidle');
    const row = page.locator('tbody tr', { hasText: title });
    const before = await row.locator('img').first().getAttribute('src');
    expect(before).toContain('/lessons/image_');

    await row.getByRole('button', { name: 'Editar' }).click();
    const panel = page.frameLocator('iframe[title="Editar arquivo"]');
    await expect(panel.getByLabel('Título')).toHaveValue(title, { timeout: 30_000 });
    await (await (await page.locator('iframe[title="Editar arquivo"]').elementHandle())!.contentFrame())!.waitForLoadState('networkidle');

    const uploads: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && new URL(r.url()).pathname === '/api/uploads' && uploads.push(r.url()));
    // PNG diferente do original (cor diferente) para a URL do objeto mudar.
    const png2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await panel.locator('#photo').setInputFiles({ name: 'nova-capa.png', mimeType: 'image/png', buffer: png2 });
    await panel.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.locator('tbody tr', { hasText: title }).locator('img').first()).not.toHaveAttribute('src', before!, { timeout: 30_000 });
    expect(uploads.length).toBeGreaterThanOrEqual(1); // a imagem nova foi enviada direto (plano em /api/uploads)
    // O objeto antigo foi apagado do storage.
    const gone = await page.evaluate(async (u) => (await fetch(u)).status, before!);
    expect(gone).toBe(404);
    void id;
  });
});
