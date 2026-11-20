import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

async function openMenuItem(page: import('@playwright/test').Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name }).click();
}

test.describe('Modais', () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test('Alterar senha: valida campos, recusa senha atual errada e fecha', async ({ page }) => {
    await openMenuItem(page, 'Alterar senha');
    const dialog = page.getByRole('dialog', { name: 'Alterar senha' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog.getByText('Informe a senha atual')).toBeVisible();
    await expect(dialog.getByText('Informe a nova senha')).toBeVisible();

    await dialog.getByLabel('Senha atual').fill('senha-errada');
    await dialog.getByLabel(/^Nova senha/).fill('abc12345');
    await dialog.getByLabel('Confirmar nova senha').fill('diferente');
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog.getByText('As senhas não conferem')).toBeVisible();

    await dialog.getByLabel('Confirmar nova senha').fill('abc12345');
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog.getByText('A senha atual está incorreta.')).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
  });

  test('o botão de olho mostra e oculta a senha', async ({ page }) => {
    await openMenuItem(page, 'Alterar senha');
    const dialog = page.getByRole('dialog', { name: 'Alterar senha' });
    const field = dialog.getByLabel('Senha atual');
    await expect(field).toHaveAttribute('type', 'password');
    await dialog.getByRole('button', { name: 'Mostrar senha' }).first().click();
    await expect(dialog.getByLabel('Senha atual')).toHaveAttribute('type', 'text');
    await dialog.getByRole('button', { name: 'Ocultar senha' }).first().click();
    await expect(dialog.getByLabel('Senha atual')).toHaveAttribute('type', 'password');
  });

  test('Editar perfil exige o nome', async ({ page }) => {
    await openMenuItem(page, 'Perfil');
    const dialog = page.getByRole('dialog', { name: 'Editar perfil' });
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog.getByText('Informe o seu nome')).toBeVisible();
    await dialog.getByRole('button', { name: 'Fechar' }).click();
    await expect(dialog).toBeHidden();
  });

  test('Solicitação de acesso abre com os detalhes', async ({ page }) => {
    // Cria uma solicitação pela tela pública, abre o detalhe e a exclui.
    const ctx = await page.context().browser()!.newContext();
    const anon = await ctx.newPage();
    await anon.goto('/auth/request-account');
    await anon.waitForLoadState('networkidle');
    await anon.getByLabel('Nome').fill('Pessoa Teste E2E');
    await anon.getByLabel('E-mail').fill('e2e@example.com');
    await anon.getByLabel(/Mensagem/).fill('Quero acompanhar as transcrições da equipe.');
    await anon.getByRole('button', { name: 'Solicitar acesso' }).click();
    await anon.waitForTimeout(1500);
    await ctx.close();

    await page.goto('/admin/users/requests');
    const row = page.locator('tbody tr', { hasText: 'e2e@example.com' }).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Ver detalhes' }).click();
    const dialog = page.getByRole('dialog', { name: 'Solicitação de acesso' });
    await expect(dialog.getByText('Quero acompanhar as transcrições da equipe.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Fechar' }).last().click();

    await row.getByRole('button', { name: 'Excluir solicitação' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator('tbody tr', { hasText: 'e2e@example.com' })).toHaveCount(0);
  });
});
