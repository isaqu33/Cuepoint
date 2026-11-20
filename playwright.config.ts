import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra a stack em Docker já no ar (docker compose up) com os dados de demonstração:
 *   npm run db:seed:admin && npm run db:seed:demo
 * Variáveis: E2E_BASE_URL, E2E_EMAIL, E2E_PASSWORD.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /.*\.spec\.ts/,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3300',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    // Em container na rede do compose, "localhost" não é o host: mapeia o storage e o tempo real para os serviços.
    // Direto na máquina/runner (CI), as portas publicadas já respondem em localhost: não precisa mapear.
    launchOptions: {
      args: process.env.E2E_IN_CONTAINER === 'true' ? ['--host-resolver-rules=MAP localhost:9000 minio:9000, MAP localhost:3301 realtime:3001'] : [],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
