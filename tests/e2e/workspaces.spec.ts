import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const wav = readFileSync(path.join(__dirname, 'fixtures/fala.wav'));
const png = readFileSync(path.join(__dirname, 'fixtures/pixel.png'));

/**
 * Envia áudio e capa direto ao storage e cria o arquivo pela API (mesmo caminho do formulário e do lote).
 * O PUT sai do NAVEGADOR (o storage é alcançável por ele; também prova o CORS).
 */
async function createFileViaApi(page: Page, title: string) {
  const put = async (kind: 'audio' | 'image', type: string, body: Buffer) => {
    const plan = await page.request.post('/api/uploads', { data: { kind, contentType: type, size: body.length } });
    if (!plan.ok()) return { plan };
    const p = await plan.json();
    const status = await page.evaluate(
      async ({ url, type, b64 }) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        return (await fetch(url, { method: 'PUT', headers: { 'Content-Type': type }, body: bytes })).status;
      },
      { url: p.uploadUrl as string, type, b64: body.toString('base64') },
    );
    expect(status).toBe(200);
    return { plan, key: p.key as string };
  };
  const a = await put('audio', 'audio/wav', wav);
  if (!a.plan.ok()) return { status: a.plan.status(), body: await a.plan.json() };
  const i = await put('image', 'image/png', png);
  const res = await page.request.post('/api/lessons', { data: { title, description: 'Arquivo do teste de espaços', audioKey: a.key, imageKey: i.key } });
  return { status: res.status(), body: await res.json() };
}

async function loginRequest(browser: Browser, email: string, password: string) {
  const context = await browser.newContext({ baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3300', locale: 'pt-BR' });
  const page = await context.newPage();
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
  return { context, page };
}

test.describe('Espaços de trabalho: criação, isolamento e limites', () => {
  test.setTimeout(150_000);

  test('o operador cria um espaço; o admin dele não enxerga nem altera o espaço principal e respeita os limites', async ({ page, browser }) => {
    await loginAsAdmin(page); // conta de sistema = operador de plataforma
    const stamp = Date.now();
    const adminEmail = `e2e-${stamp}@teste.local`;
    const adminPassword = 'senha-e2e-1234';

    // O arquivo do espaço principal (dado de demonstração) é o alvo das tentativas de invasão.
    await page.goto('/app');
    const href = await page.locator('a[href*="/app/lesson/"]').first().getAttribute('href');
    const principalId = /\/lesson\/([^/?]+)/.exec(href ?? '')![1];

    // Validação da criação.
    const bad = await page.request.post('/api/workspaces', { data: { name: 'X', admin: { name: 'A', email: 'nao-e-email', password: '123' } } });
    expect(bad.status()).toBe(400);

    const created = await page.request.post('/api/workspaces', {
      data: { name: `Espaço E2E ${stamp}`, maxFiles: 1, maxStorageMB: 50, admin: { name: 'Admin E2E', email: adminEmail, password: adminPassword } },
    });
    expect(created.status()).toBe(201);
    const { id: wsId } = await created.json();
    expect((await page.request.post('/api/workspaces', { data: { name: `Outro ${stamp}`, admin: { name: 'Admin', email: adminEmail, password: adminPassword } } })).status()).toBe(409);

    // O operador vê o espaço novo na tela, com uso e limites.
    await page.goto('/admin/workspaces');
    await expect(page.getByTestId('espacos').locator(`tr`, { hasText: `Espaço E2E ${stamp}` })).toContainText('0 / 1');

    // ---- A partir daqui: o administrador do novo espaço ----
    const b = await loginRequest(browser, adminEmail, adminPassword);
    const req = b.context.request;
    try {
      // Não enxerga o conteúdo do espaço principal.
      await b.page.goto('/app');
      await expect(b.page.getByRole('heading', { name: 'Biblioteca', level: 1 })).toBeVisible();
      await expect(b.page.getByText('Discurso de posse')).toHaveCount(0);
      await b.page.goto('/admin/lessons');
      await expect(b.page.getByText('Discurso de posse')).toHaveCount(0);

      // Nem por id: tudo devolve 404 (ou lista vazia), nunca o dado do outro espaço.
      expect((await req.get(`/api/jobs/${principalId}`)).status()).toBe(404);
      expect((await req.get(`/api/jobs/${principalId}/events`)).status()).toBe(404);
      expect((await req.post(`/api/lessons/${principalId}/transcription`)).status()).toBe(404);
      expect((await req.get(`/api/transcriptions/${principalId}/export?format=txt`)).status()).toBe(404);
      expect((await req.put(`/api/transcriptions/${principalId}`, { data: { cues: [{ startMs: 0, endMs: 10, text: 'invadido' }] } })).status()).toBe(404);
      expect((await req.post(`/api/lessons/${principalId}/share`, { data: {} })).status()).toBe(404);
      expect((await (await req.get(`/api/timeline/${principalId}`)).json()).events).toEqual([]);

      // Funções de plataforma: só o operador.
      expect((await req.get('/api/workspaces')).status()).toBe(403);
      expect((await req.get('/api/metrics')).status()).toBe(403);
      expect((await req.post('/api/batch/run?job=reconcile')).status()).toBe(403);
      await b.page.goto('/admin/workspaces');
      await expect(b.page).toHaveURL(/\/app/);

      // Limite de arquivos do espaço (1): o primeiro entra, o segundo é recusado.
      const first = await createFileViaApi(b.page, `Arquivo do espaço ${stamp}`);
      expect(first.status).toBe(201);
      const second = await createFileViaApi(b.page, `Segundo arquivo ${stamp}`);
      expect(second.status).toBe(413);
      expect(second.body.error).toMatch(/Limite de 1 arquivo/);

      // O arquivo é do espaço dele: aparece na lista dele e o histórico registra o envio.
      await b.page.goto('/admin/lessons');
      await expect(b.page.getByText(`Arquivo do espaço ${stamp}`)).toBeVisible();
      expect((await (await req.get(`/api/timeline/${first.body.id}`)).json()).events.map((e: { type: string }) => e.type)).toContain('media.file.uploaded');

      // Limite de armazenamento: o operador aperta o limite e o envio de 2 MB é recusado.
      expect((await page.request.patch(`/api/workspaces/${wsId}`, { data: { maxFiles: null, maxStorageMB: 1 } })).status()).toBe(200);
      const big = await req.post('/api/uploads', { data: { kind: 'audio', contentType: 'audio/wav', size: 2 * 1024 ** 2 } });
      expect(big.status()).toBe(413);

      // Limpeza do que o espaço criou.
      const origin = new URL(b.page.url()).origin;
      await req.post('/admin/lessons?/deleteAction', { form: { id: first.body.id }, headers: { origin } });
    } finally {
      await b.context.close();
    }

    // O operador vê o uso atualizado e remove o espaço de teste (só vazio; o padrão nunca).
    expect((await page.request.delete('/api/workspaces/ws_default')).status()).toBe(400);
    expect((await page.request.delete(`/api/workspaces/${wsId}`)).status()).toBe(200);
  });
});
