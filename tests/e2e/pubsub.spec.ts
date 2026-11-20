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

async function openPanel(page: Page, button: string, title: string) {
  await page.getByRole('button', { name: button }).first().click();
  const handle = await page.locator(`iframe[title="${title}"]`).elementHandle();
  await (await handle!.contentFrame())!.waitForLoadState('networkidle');
  return page.frameLocator(`iframe[title="${title}"]`);
}

test.describe('Pub/sub: eventos de transcrição', () => {
  test.setTimeout(150_000);

  test('um pedido de transcrição gera eventos que chegam ao feed ao vivo e às métricas', async ({ page, context }) => {
    await loginAsAdmin(page);
    const title = `Evento E2E ${Date.now()}`;

    // 1) Cria um arquivo com áudio (silêncio) pelo painel.
    await page.goto('/admin/lessons');
    const form = await openPanel(page, 'Novo arquivo', 'Novo arquivo');
    await form.locator('#Title').fill(title);
    await form.locator('#description').fill('Arquivo criado pelo teste de eventos');
    await form.locator('#photo').setInputFiles(path.join(__dirname, 'fixtures/pixel.png'));
    await form.locator('#audio').setInputFiles({ name: 'silencio.wav', mimeType: 'audio/wav', buffer: silentWav() });
    await form.getByRole('button', { name: 'Criar', exact: true }).click();
    const row = page.locator('tbody tr', { hasText: title });
    await expect(row).toBeVisible();

    // 2) Abre o Processamento em OUTRA aba e fica só olhando (sem recarregar).
    const watcher = await context.newPage();
    await watcher.goto('/admin/processing');
    await watcher.waitForLoadState('networkidle');
    const feed = watcher.getByTestId('atividade');
    // Só dispara o pedido depois que o observador está de fato conectado ao tempo real
    // (no dev, o Vite pode recarregar a página ao otimizar dependências e derrubar o socket).
    await expect(feed).toHaveAttribute('data-live', 'true', { timeout: 30_000 });

    // 3) Na aba original, pede a transcrição.
    await row.getByRole('button', { name: 'Transcrever' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Transcrever' }).click();
    await expect(page.getByText('Ação concluída com sucesso')).toBeVisible();

    // 4) O feed da outra aba recebe os fatos pelo tópico → realtime → navegador.
    await expect(feed.getByText(title).first()).toBeVisible({ timeout: 20_000 });
    await expect(feed.locator('li', { hasText: title }).getByText('entrou na fila')).toBeVisible({ timeout: 20_000 });
    await expect(feed.locator('li', { hasText: title }).getByText('começou a transcrição')).toBeVisible({ timeout: 40_000 });
    const terminal = feed.locator('li', { hasText: title }).getByText(/transcrição (concluída|falhou)/).first();
    await expect(terminal).toBeVisible({ timeout: 90_000 });

    // 5) O assinante de métricas contou os eventos (independente do que a tela fez).
    const res = await page.request.get('/api/metrics');
    expect(res.ok()).toBe(true);
    const metrics = await res.json();
    expect(metrics.queued).toBeGreaterThanOrEqual(1);
    expect(metrics.started).toBeGreaterThanOrEqual(1);
    expect(metrics.completed + metrics.failed).toBeGreaterThanOrEqual(1);

    // 6) O fato ficou registrado no log: sobrevive a recarregar a página.
    await watcher.reload();
    await expect(watcher.getByTestId('atividade').locator('li', { hasText: title }).first()).toBeVisible();

    // Limpeza: espera sair de "em andamento" e exclui o arquivo.
    await page.goto('/admin/lessons');
    const again = page.locator('tbody tr', { hasText: title });
    await expect(again.getByRole('button', { name: 'Excluir' })).toBeEnabled({ timeout: 60_000 });
    await again.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator('tbody tr', { hasText: title })).toHaveCount(0);
  });
});
