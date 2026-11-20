import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const wav = readFileSync(path.join(__dirname, 'fixtures/fala.wav'));
const SHOTS = process.env.E2E_SHOTS_DIR; // opcional: salva capturas nos dois temas

test.describe('Envio em lote', () => {
  test.setTimeout(150_000);

  test('envia vários áudios direto ao storage, cria os arquivos e enfileira as transcrições', async ({ page }) => {
    await loginAsAdmin(page);
    const createdIds: string[] = [];
    page.on('response', async (r) => {
      if (r.url().endsWith('/api/lessons') && r.request().method() === 'POST' && r.status() === 201) createdIds.push((await r.json()).id);
    });
    const stamp = Date.now();
    const names = [`Lote ${stamp} A.wav`, `Lote ${stamp} B.wav`, `Lote ${stamp} B.wav`];

    await page.goto('/admin/lessons');
    await page.getByRole('button', { name: 'Envio em lote' }).click();
    const panel = page.frameLocator('iframe[title="Envio em lote"]');
    // No dev, o primeiro acesso à rota compila na hora e pode recarregar o quadro: espera o conteúdo, não a rede.
    await expect(panel.getByText('Arraste os arquivos aqui')).toBeVisible({ timeout: 30_000 });
    // Só mexe nos campos depois da hidratação (o HTML do servidor aparece antes dos handlers).
    await (await (await page.locator('iframe[title="Envio em lote"]').elementHandle())!.contentFrame())!.waitForLoadState('networkidle');

    // Validação: sem arquivos nem capa, não envia.
    await expect(panel.getByRole('button', { name: /Enviar/ })).toBeDisabled();

    await panel.locator('#batch-audio').setInputFiles(names.map((name) => ({ name, mimeType: 'audio/wav', buffer: wav })));
    await panel.locator('#batch-cover').setInputFiles(path.join(__dirname, 'fixtures/pixel.png'));
    const list = panel.getByTestId('lote');
    await expect(list.locator('li')).toHaveCount(3);
    // Títulos repetidos dentro do lote ganham numeração.
    await expect(list).toContainText(`Lote ${stamp} B (2)`);

    if (SHOTS) await page.screenshot({ path: `${SHOTS}/lote-antes-${(await page.evaluate(() => document.documentElement.classList.contains('dark'))) ? 'escuro' : 'claro'}.png` });

    await panel.getByRole('button', { name: /Enviar 3 arquivos/ }).click();
    await expect(panel.getByTestId('resumo-lote')).toContainText('3 de 3 arquivo(s) enviado(s)', { timeout: 90_000 });
    await expect(list.locator('li[data-status="queued"]')).toHaveCount(3);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/lote-depois-claro.png` });

    // Os três viraram arquivos da biblioteca e as transcrições entraram na fila (ou já terminaram).
    await panel.getByRole('button', { name: 'Fechar' }).click();
    await expect(page.locator('tbody tr', { hasText: `Lote ${stamp} A` })).toBeVisible();
    for (const t of [`Lote ${stamp} A`, `Lote ${stamp} B`, `Lote ${stamp} B (2)`]) {
      await expect(page.locator('tbody tr', { hasText: t }).first()).toBeVisible();
    }

    // Limpeza: espera a fila esvaziar e exclui, para não poluir os dados de demonstração.
    await expect
      .poll(async () => (await (await page.request.get('/api/metrics')).json()).queueNow, { timeout: 120_000 })
      .toMatchObject({ waiting: 0, active: 0 });
    expect(createdIds).toHaveLength(3);
    const origin = new URL(page.url()).origin;
    for (const id of createdIds) await page.request.post('/admin/lessons?/deleteAction', { form: { id }, headers: { origin } });
  });
});
