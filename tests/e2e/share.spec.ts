import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Compartilhamento por link temporário', () => {
  test.setTimeout(90_000);

  test('gera o link, o visitante vê sem login, baixa a legenda, e a revogação corta o acesso', async ({ page, browser }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/lessons');
    await page.waitForLoadState('networkidle');

    // Admin gera o link pela interface.
    await page.getByRole('button', { name: /Compartilhar Discurso de posse/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Compartilhar' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Válido por').selectOption('1');
    await dialog.getByRole('button', { name: 'Gerar link' }).click();
    const url = await dialog.locator('#share-url').inputValue();
    expect(url).toMatch(/\/s\/[A-Za-z0-9_-]{43}$/);
    const rows = dialog.getByTestId('links').locator('li');
    await expect(rows.first()).toHaveAttribute('data-active', 'true'); // o link novo é o primeiro da lista

    // Visitante sem login (outro contexto, sem cookies).
    const visitor = await browser.newContext({ locale: 'pt-BR' });
    const vp = await visitor.newPage();
    try {
      const res = await vp.goto(url);
      expect(res?.status()).toBe(200);
      expect(res?.headers()['cache-control']).toContain('no-store');
      expect(res?.headers()['x-robots-tag']).toContain('noindex');
      await expect(vp.getByTestId('titulo-compartilhado')).toContainText('Discurso de posse');
      await expect(vp.locator('button.cue').first()).toBeVisible();
      await expect(vp.getByText(/Este link é válido até/)).toBeVisible();

      // Legenda e áudio (com Range) funcionam pelo link; o endereço do storage não é exposto.
      const token = url.split('/').pop();
      const srt = await vp.request.get(`/s/${token}/export?format=srt`);
      expect(srt.status()).toBe(200);
      expect(srt.headers()['content-type']).toContain('application/x-subrip');
      const audio = await vp.request.get(`/s/${token}/audio`, { headers: { Range: 'bytes=0-99' } });
      expect(audio.status()).toBe(206);
      expect((await audio.body()).length).toBe(100);
      expect(await vp.content()).not.toContain('github.com/ggml-org');

      // O visitante não acessa nada do painel nem das APIs administrativas.
      expect((await vp.request.get('/api/metrics')).status()).toBe(401);
      await vp.goto('/admin/lessons');
      await expect(vp).toHaveURL(/\/auth\/login/);

      // Revogar corta o acesso na hora (página, legenda e áudio).
      await rows.first().getByRole('button', { name: 'Revogar' }).click();
      await expect(rows.first()).toHaveAttribute('data-active', 'false');
      await expect(rows.first()).toContainText('Revogado');
      const after = await vp.goto(url);
      expect(after?.status()).toBe(410);
      await expect(vp.getByTestId('erro-link')).toHaveText('Este link foi desativado');
      expect((await vp.request.get(`/s/${token}/export?format=srt`)).status()).toBe(410);
      expect((await vp.request.get(`/s/${token}/audio`)).status()).toBe(410);
    } finally {
      await visitor.close();
    }
  });

  test('endereço inventado ou malformado devolve 404, sem vazar nada', async ({ browser }) => {
    const visitor = await browser.newContext({ locale: 'pt-BR' });
    const vp = await visitor.newPage();
    try {
      for (const t of ['abc', 'A'.repeat(43), '..%2F..%2Fetc%2Fpasswd']) {
        const r = await vp.goto(`/s/${t}`);
        expect(r?.status(), t).toBe(404);
        await expect(vp.getByTestId('erro-link')).toHaveText('Link não encontrado');
      }
    } finally {
      await visitor.close();
    }
  });
});
