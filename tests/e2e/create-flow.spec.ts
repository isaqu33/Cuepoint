import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test('criar subcoleção pelo painel atualiza a lista sem recarregar, e dá para excluir', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/series');
  const name = `Teste E2E ${Date.now()}`;
  await page.getByRole('button', { name: 'Nova subcoleção' }).first().click();

  const form = page.frameLocator('iframe[title="Nova subcoleção"]');
  await form.locator('#Title').fill(name);
  await form.locator('#About').fill('Criada pelo teste automatizado');
  await form.getByRole('button', { name: /Discurso de posse/ }).first().click(); // escolhe um arquivo
  await form.locator('input[type="file"]').setInputFiles(path.join(__dirname, 'fixtures/pixel.png'));
  await expect(form.getByAltText('Prévia da imagem selecionada')).toBeVisible(); // a imagem escolhida aparece
  await form.getByRole('button', { name: 'Criar', exact: true }).click();

  // Painel fecha, aviso aparece e a nova linha surge na tabela de fora (sem reload manual).
  await expect(page.getByRole('dialog', { name: 'Nova subcoleção' })).toBeHidden();
  await expect(page.getByText('Alterações salvas')).toBeVisible();
  const row = page.locator('tbody tr', { hasText: name });
  await expect(row).toBeVisible();

  // Limpeza: exclui o registro criado.
  await row.getByRole('button', { name: 'Excluir' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(0);
});

test('o botão Atualizar recarrega a lista', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/lessons');
  const reload = page.getByRole('button', { name: 'Atualizar a lista' });
  await expect(reload).toBeVisible();
  const requested = page.waitForResponse((r) => r.url().includes('/admin/lessons') && r.request().method() === 'GET');
  await reload.click();
  await requested;
  await expect(reload).toBeEnabled();
});
