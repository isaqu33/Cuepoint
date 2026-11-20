import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Painel lateral e ações da lista', () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test('"Nova coleção" abre o formulário em painel e Cancelar fecha sem avisar', async ({ page }) => {
    await page.goto('/admin/courses');
    await page.getByRole('button', { name: 'Nova coleção' }).first().click();

    const panel = page.getByRole('dialog', { name: 'Nova coleção' });
    await expect(panel).toBeVisible();
    const form = page.frameLocator('iframe[title="Nova coleção"]');
    await expect(form.getByLabel('Título')).toBeVisible(); // formulário traduzido
    await expect(form.locator('aside, nav[aria-label="Navegação principal"]')).toHaveCount(0); // sem menu dentro do painel

    await form.getByRole('link', { name: 'Cancelar' }).click();
    await expect(panel).toBeHidden();
    await expect(page.getByText('Alterações salvas')).toHaveCount(0);
  });

  test('Esc fecha o painel', async ({ page }) => {
    await page.goto('/admin/series');
    await page.getByRole('button', { name: 'Nova subcoleção' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Nova subcoleção' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Nova subcoleção' })).toBeHidden();
  });

  test('editar abre o painel com o registro carregado', async ({ page }) => {
    await page.goto('/admin/series');
    const row = page.locator('tbody tr').first();
    const title = (await row.locator('td').first().innerText()).trim();
    await row.getByRole('button', { name: 'Editar' }).click();
    const form = page.frameLocator('iframe[title="Editar subcoleção"]');
    await expect(form.locator('input[name="Title"], input[type="text"]').first()).toHaveValue(title);
  });

  test('despublicar e publicar pedem confirmação e atualizam o status', async ({ page }) => {
    await page.goto('/admin/series');
    const row = page.locator('tbody tr').first();
    await expect(row.getByText('Publicada')).toBeVisible();

    // Cancelar na confirmação não muda nada.
    await row.getByRole('button', { name: 'Despublicar' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Despublicar' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(row.getByText('Publicada')).toBeVisible();

    // Confirmar despublica.
    await row.getByRole('button', { name: 'Despublicar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Despublicar' }).click();
    await expect(row.getByText('Rascunho')).toBeVisible();
    await expect(page.getByText('Ação concluída com sucesso')).toBeVisible();

    // Restaura o estado original.
    await row.getByRole('button', { name: 'Publicar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click();
    await expect(row.getByText('Publicada')).toBeVisible();
  });

  test('excluir exige confirmação em destaque (e não executa ao cancelar)', async ({ page }) => {
    await page.goto('/admin/courses');
    const rows = page.locator('tbody tr');
    const before = await rows.count();
    await rows.first().getByRole('button', { name: 'Excluir' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Esta ação não pode ser desfeita' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(rows).toHaveCount(before);
  });
});
