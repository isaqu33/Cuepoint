import { expect, test } from '@playwright/test';
import { loginAsAdmin, nav } from './helpers';

test.describe('Navegação e nomes', () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test('o menu usa o vocabulário Coleção → Subcoleção → Arquivo → Membros', async ({ page }) => {
    for (const label of ['Biblioteca', 'Processamento', 'Arquivos', 'Coleções', 'Subcoleções', 'Membros', 'Solicitações']) {
      await expect(nav(page).getByRole('link', { name: label, exact: true })).toBeVisible();
    }
  });

  for (const [label, heading] of [
    ['Processamento', 'Processamento'],
    ['Arquivos', 'Arquivos'],
    ['Coleções', 'Coleções'],
    ['Subcoleções', 'Subcoleções'], // o título da página deve bater com o item do menu
    ['Membros', 'Membros'],
    ['Solicitações', 'Solicitações'],
  ] as const) {
    test(`"${label}" abre a página com o mesmo título`, async ({ page }) => {
      await nav(page).getByRole('link', { name: label, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
      await expect(nav(page).getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    });
  }

  test('não sobra texto de legado em inglês nas listas', async ({ page }) => {
    for (const path of ['/admin/series', '/admin/courses', '/admin/lessons', '/admin/users']) {
      await page.goto(path);
      const text = await page.locator('main').innerText();
      expect(text, path).not.toMatch(/\b(Series|Courses|Lessons|Published|Actions|Title)\b/);
    }
  });
});
