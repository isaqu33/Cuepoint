import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test('alterna entre claro e escuro e lembra a escolha', async ({ page }) => {
  await loginAsAdmin(page);
  const html = page.locator('html');
  const toggle = page.getByRole('button', { name: /Ativar tema (claro|escuro)/ });

  // Parte de um estado conhecido: claro.
  if (await html.evaluate((el) => el.classList.contains('dark'))) await toggle.click();
  await expect(html).not.toHaveClass(/dark/);

  await toggle.click();
  await expect(html).toHaveClass(/dark/);

  await page.reload();
  await expect(html).toHaveClass(/dark/); // persistiu

  await page.getByRole('button', { name: 'Ativar tema claro' }).click();
  await expect(html).not.toHaveClass(/dark/);
});
