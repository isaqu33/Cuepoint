import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { EMAIL, PASSWORD } from './helpers';

/**
 * Gera as imagens e os vídeos do case público (case-study/). Só roda com E2E_CASE_DIR definido:
 *   E2E_CASE_DIR=/case npx playwright test tests/e2e/case-media.spec.ts
 */
const DIR = process.env.E2E_CASE_DIR;
const fixture = (n: string) => readFileSync(path.join(__dirname, 'fixtures', n));
const pause = (page: Page, ms = 900) => page.waitForTimeout(ms);

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
}

async function setTheme(page: Page, theme: 'claro' | 'escuro') {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if ((theme === 'escuro') !== isDark) await page.getByRole('button', { name: new RegExp(`Ativar tema ${theme === 'escuro' ? 'escuro' : 'claro'}`) }).click();
}

const shot = (page: Page, name: string, theme: string) => page.screenshot({ path: `${DIR}/img/${name}-${theme}.png` });

async function createMediaViaApi(page: Page, title: string, wav: Buffer, name = 'audio.wav') {
  const key = async (kind: 'audio' | 'image', type: string, body: Buffer) => {
    const plan = await (await page.request.post('/api/uploads', { data: { kind, contentType: type, size: body.length } })).json();
    await page.evaluate(async ({ url, type, b64 }) => {
      await fetch(url, { method: 'PUT', headers: { 'Content-Type': type }, body: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) });
    }, { url: plan.uploadUrl, type, b64: body.toString('base64') });
    return plan.key as string;
  };
  const res = await page.request.post('/api/lessons', {
    data: { title, description: 'Gravação de demonstração do Cuepoint.', audioName: name, imageName: 'capa.png', audioKey: await key('audio', 'audio/wav', wav), imageKey: await key('image', 'image/png', fixture('pixel.png')) },
  });
  return (await res.json()).id as string;
}

test.describe('Case público: capturas e vídeos', () => {
  test.skip(!DIR, 'defina E2E_CASE_DIR para gerar as mídias do case');
  test.setTimeout(300_000);

  test('capturas de tela nos dois temas', async ({ page, browser }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    const id = await createMediaViaApi(page, 'Boas-vindas ao Cuepoint', fixture('fala.wav'), 'boas-vindas.wav');
    await page.request.post(`/api/lessons/${id}/transcription`);
    await expect.poll(async () => (await (await page.request.get(`/api/jobs/${id}`)).json()).status, { timeout: 120_000 }).toBe('READY');

    for (const theme of ['claro', 'escuro'] as const) {
      await page.goto('/app');
      await setTheme(page, theme);
      await page.waitForLoadState('networkidle');
      await shot(page, '01-biblioteca', theme);

      await page.goto('/admin/processing');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('atividade')).toHaveAttribute('data-live', 'true', { timeout: 30_000 });
      await shot(page, '02-processamento', theme);

      await page.goto('/admin/lessons');
      await page.waitForLoadState('networkidle');
      await shot(page, '03-arquivos', theme);

      await page.goto(`/app/lesson/${id}`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: 'Histórico' }).click();
      await expect(page.getByTestId('linha-do-tempo')).toBeVisible();
      await page.waitForTimeout(600);
      await shot(page, '04-revisao-historico', theme);
      await page.getByRole('button', { name: 'Editar trechos' }).click();
      await expect(page.getByTestId('editor-trechos')).toBeVisible();
      await shot(page, '05-revisao-edicao', theme);

      await page.goto('/admin/lessons');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: 'Envio em lote' }).click();
      const panel = page.frameLocator('iframe[title="Envio em lote"]');
      await expect(panel.getByText('Arraste os arquivos aqui')).toBeVisible({ timeout: 30_000 });
      await (await (await page.locator('iframe[title="Envio em lote"]').elementHandle())!.contentFrame())!.waitForLoadState('networkidle');
      await panel.locator('#batch-audio').setInputFiles([
        { name: 'Aula 01 - Introdução.wav', mimeType: 'audio/wav', buffer: fixture('fala.wav') },
        { name: 'Aula 02 - Primeiros passos.wav', mimeType: 'audio/wav', buffer: fixture('fala.wav') },
        { name: 'Aula 03 - Revisão.mp4', mimeType: 'video/mp4', buffer: fixture('fala.mp4') },
      ]);
      await panel.locator('#batch-cover').setInputFiles(path.join(__dirname, 'fixtures/pixel.png'));
      await expect(panel.getByTestId('lote').locator('li')).toHaveCount(3);
      await shot(page, '06-envio-em-lote', theme);
      await page.keyboard.press('Escape');

      await page.goto('/admin/lessons');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: /Compartilhar Boas-vindas/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Compartilhar' });
      await dialog.getByRole('button', { name: 'Gerar link' }).click();
      await expect(dialog.getByTestId('link-gerado')).toBeVisible();
      await shot(page, '07-compartilhar', theme);
      if (theme === 'claro') {
        const url = await dialog.locator('#share-url').inputValue();
        const visitor: BrowserContext = await browser.newContext({ viewport: { width: 1100, height: 900 }, locale: 'pt-BR' });
        const vp = await visitor.newPage();
        await vp.goto(url);
        await expect(vp.getByTestId('titulo-compartilhado')).toBeVisible();
        await vp.screenshot({ path: `${DIR}/img/08-link-publico-claro.png` });
        await visitor.close();
      }

      await page.goto('/admin/workspaces');
      await page.waitForLoadState('networkidle');
      await shot(page, '09-espacos', theme);
    }
    // limpeza do arquivo criado para as capturas
    const origin = new URL(page.url()).origin;
    await page.request.post('/admin/lessons?/deleteAction', { form: { id }, headers: { origin } });
    const lessons = await page.request.get('/api/metrics');
    expect(lessons.ok()).toBe(true);
  });

  test('vídeo: caminho feliz (enviar, transcrever, revisar) e falha com recuperação', async ({ browser }) => {
    const size = { width: 1280, height: 720 };
    const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: `${DIR}/video/raw-feliz`, size }, locale: 'pt-BR' });
    const page = await ctx.newPage();
    await login(page);
    await pause(page, 1200);

    // ---- Caminho feliz: novo arquivo pelo painel → transcrever → acompanhar → revisar
    await page.goto('/admin/lessons');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Novo arquivo' }).first().click();
    const panel = page.frameLocator('iframe[title="Novo arquivo"]');
    await expect(panel.locator('#Title')).toBeVisible({ timeout: 30_000 });
    await (await (await page.locator('iframe[title="Novo arquivo"]').elementHandle())!.contentFrame())!.waitForLoadState('networkidle');
    const title = `Pregação de domingo ${Date.now() % 1000}`;
    await panel.locator('#Title').pressSequentially(title, { delay: 45 });
    await panel.locator('#description').pressSequentially('Mensagem gravada no culto de domingo.', { delay: 30 });
    await panel.locator('#photo').setInputFiles(path.join(__dirname, 'fixtures/pixel.png'));
    await panel.locator('#audio').setInputFiles({ name: 'pregacao.wav', mimeType: 'audio/wav', buffer: fixture('fala.wav') });
    await pause(page, 1200);
    await panel.getByRole('button', { name: 'Criar', exact: true }).click();
    const row = page.locator('tbody tr', { hasText: title });
    await expect(row).toBeVisible();
    await pause(page, 1000);
    await row.getByRole('button', { name: 'Transcrever' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Transcrever' }).click();
    await pause(page, 1500);
    await page.goto('/admin/processing');
    await expect(page.getByTestId('atividade')).toHaveAttribute('data-live', 'true', { timeout: 30_000 });
    await expect(page.getByTestId('atividade').locator('li', { hasText: title }).getByText('transcrição concluída').first()).toBeVisible({ timeout: 120_000 });
    await pause(page, 1500);
    await page.goto('/app');
    await page.getByRole('link', { name: new RegExp(title) }).first().click();
    await expect(page.locator('button.cue').first()).toBeVisible({ timeout: 20_000 });
    await pause(page, 1500);
    await page.locator('button.cue').first().click();
    await pause(page, 2500);
    const happy = page.video();

    // ---- Falha e recuperação: áudio sem fala falha; troca o áudio e reprocessa
    const bad = `Gravação sem som ${Date.now() % 1000}`;
    await page.goto('/admin/lessons');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Novo arquivo' }).first().click();
    const p2 = page.frameLocator('iframe[title="Novo arquivo"]');
    await expect(p2.locator('#Title')).toBeVisible({ timeout: 30_000 });
    await (await (await page.locator('iframe[title="Novo arquivo"]').elementHandle())!.contentFrame())!.waitForLoadState('networkidle');
    const silent = Buffer.concat([fixture('fala.wav').subarray(0, 44), Buffer.alloc(48_000, 0)]);
    await p2.locator('#Title').pressSequentially(bad, { delay: 40 });
    await p2.locator('#description').pressSequentially('Arquivo de teste sem áudio audível.', { delay: 25 });
    await p2.locator('#photo').setInputFiles(path.join(__dirname, 'fixtures/pixel.png'));
    await p2.locator('#audio').setInputFiles({ name: 'sem-som.wav', mimeType: 'audio/wav', buffer: silent });
    await p2.getByRole('button', { name: 'Criar', exact: true }).click();
    const row2 = page.locator('tbody tr', { hasText: bad });
    await expect(row2).toBeVisible();
    await row2.getByRole('button', { name: 'Transcrever' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Transcrever' }).click();
    await page.goto('/admin/processing');
    await expect(page.getByTestId('atividade')).toHaveAttribute('data-live', 'true', { timeout: 30_000 });
    await expect(page.getByTestId('atividade').locator('li', { hasText: bad }).getByText('transcrição falhou').first()).toBeVisible({ timeout: 60_000 });
    await pause(page, 1500);
    await page.goto('/admin/lessons');
    await page.waitForLoadState('networkidle');
    const failed = page.locator('tbody tr', { hasText: bad });
    await expect(failed.getByText('Falhou').first()).toBeVisible({ timeout: 90_000 });
    await pause(page, 2000);
    // Recuperação: troca o áudio pelo correto (envio direto) e reprocessa.
    await failed.getByRole('button', { name: 'Editar' }).click();
    const edit = page.frameLocator('iframe[title="Editar arquivo"]');
    await expect(edit.getByLabel('Título')).toHaveValue(bad, { timeout: 30_000 });
    await (await (await page.locator('iframe[title="Editar arquivo"]').elementHandle())!.contentFrame())!.waitForLoadState('networkidle');
    await edit.locator('#audio').setInputFiles({ name: 'gravacao-corrigida.wav', mimeType: 'audio/wav', buffer: fixture('fala.wav') });
    await pause(page, 800);
    await edit.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.locator('tbody tr', { hasText: bad })).toBeVisible();
    await pause(page, 1200);
    await page.locator('tbody tr', { hasText: bad }).getByRole('button', { name: 'Tentar transcrever de novo' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Transcrever' }).click();
    await page.goto('/admin/processing');
    await expect(page.getByTestId('atividade')).toHaveAttribute('data-live', 'true', { timeout: 30_000 });
    await expect(page.getByTestId('atividade').locator('li', { hasText: bad }).getByText('transcrição concluída').first()).toBeVisible({ timeout: 120_000 });
    await pause(page, 2500);

    // limpeza
    const origin = new URL(page.url()).origin;
    for (const t of [title, bad]) {
      await page.goto('/admin/lessons');
      await page.waitForLoadState('networkidle');
      const r = page.locator('tbody tr', { hasText: t });
      if (await r.count()) {
        await r.getByRole('button', { name: 'Excluir' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
        await expect(page.locator('tbody tr', { hasText: t })).toHaveCount(0, { timeout: 15_000 });
      }
    }
    void origin;
    await ctx.close();
    await happy?.saveAs(`${DIR}/video/caminho-feliz-e-recuperacao.webm`);
  });
});
