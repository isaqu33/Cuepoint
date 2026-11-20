import { expect, test } from '@playwright/test';
import { login, loginAsAdmin, openLogin } from './helpers';

test.describe('Acesso', () => {
  test('recusa credenciais inválidas e mostra o erro em português', async ({ page }) => {
    await login(page, 'admin@cuepoint.local', 'senha-errada-123');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText(/Senha incorreta|não foi encontrado/)).toBeVisible();
  });

  test('valida campos obrigatórios', async ({ page }) => {
    await openLogin(page);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByText('O e-mail é obrigatório')).toBeVisible();
    await expect(page.getByText('A senha é obrigatória')).toBeVisible();
  });

  test('entra, vê a Biblioteca e sai', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
    await expect(page.getByRole('heading', { name: 'Entrar no Cuepoint' })).toBeVisible();
  });

  test('rotas protegidas redirecionam para o login', async ({ page }) => {
    await page.goto('/admin/lessons');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
