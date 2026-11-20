import { expect, type Page } from '@playwright/test';

export const EMAIL = process.env.E2E_EMAIL ?? 'admin@cuepoint.local';
export const PASSWORD = process.env.E2E_PASSWORD ?? '';

/** Abre o login e espera a hidratação (no dev, o primeiro carregamento é lento). */
export async function openLogin(page: Page) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
}

export async function login(page: Page, email = EMAIL, password = PASSWORD) {
  await openLogin(page);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

export async function loginAsAdmin(page: Page) {
  await login(page);
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole('heading', { name: 'Biblioteca', level: 1 })).toBeVisible();
}

export const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegação principal' });
