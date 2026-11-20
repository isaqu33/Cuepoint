import { expect, test } from '@playwright/test';
import { loginAsAdmin, nav } from './helpers';

test.describe('Biblioteca, processamento e revisão (dados de demonstração)', () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test('a Biblioteca mostra os números e o arquivo recente com status', async ({ page }) => {
    const resumo = page.getByRole('region', { name: 'Resumo' });
    for (const label of ['Arquivos', 'Transcritos', 'Em processamento', 'Com falha']) {
      await expect(resumo.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'Arquivos recentes' })).toBeVisible();
    await expect(page.getByText('Pronto').first()).toBeVisible();
  });

  test('Processamento lista o job concluído', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Processamento', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Processamento', level: 1 })).toBeVisible();
    await expect(page.getByText('Pronto').first()).toBeVisible();
  });

  test('revisão: trechos com tempo, clique e destaque', async ({ page }) => {
    await page.getByRole('link', { name: /Discurso de posse/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Transcrição' })).toBeVisible();
    await expect(page.getByText('Clique em um trecho para ir ao momento')).toBeVisible();

    const cues = page.locator('button.cue');
    await expect(cues.first()).toBeVisible();
    expect(await cues.count()).toBeGreaterThan(0);
    await expect(cues.first()).toContainText('00:00');
    await cues.first().click(); // não deve lançar erro mesmo sem o player carregado
    await expect(page.getByRole('region', { name: 'Player de áudio' })).toBeVisible();
  });
});
