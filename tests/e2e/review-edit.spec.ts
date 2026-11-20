import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin, nav } from './helpers';

async function openReview(page: Page) {
  await page.getByRole('link', { name: /Discurso de posse/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Transcrição' })).toBeVisible();
  await page.waitForLoadState('networkidle'); // hidratação antes de clicar nos botões
}

async function editFirstCue(page: Page, text: string) {
  await page.getByRole('button', { name: 'Editar trechos' }).click();
  const editor = page.getByTestId('editor-trechos');
  await expect(editor).toBeVisible();
  await editor.locator('#t-0').fill(text);
  await editor.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Transcrição salva.')).toBeVisible();
}

test.describe('Revisão: exportar, editar e histórico', () => {
  test.setTimeout(90_000);

  test('exporta TXT, SRT e VTT; edita um trecho com validação; o histórico registra a edição', async ({ page }) => {
    await loginAsAdmin(page);
    await openReview(page);
    const id = /\/lesson\/([^/?]+)/.exec(page.url())![1];

    // Exportação: três formatos, com tipo e nome de arquivo corretos.
    const acoes = page.getByTestId('acoes-transcricao');
    for (const f of ['TXT', 'SRT', 'VTT']) await expect(acoes.getByRole('link', { name: f })).toBeVisible();
    const srt = await page.request.get(`/api/transcriptions/${id}/export?format=srt`);
    expect(srt.headers()['content-type']).toContain('application/x-subrip');
    expect(srt.headers()['content-disposition']).toMatch(/filename="[A-Za-z0-9-]+\.srt"/);
    expect(await srt.text()).toMatch(/^1\n\d\d:\d\d:\d\d,\d{3} --> /);
    expect((await page.request.get(`/api/transcriptions/${id}/export?format=pdf`)).status()).toBe(400);

    // Edição: validação no cliente (tempo inválido) e no servidor (texto vazio é recusado).
    const original = (await page.locator('button.cue').first().locator('span').last().innerText()).trim();
    await page.getByRole('button', { name: 'Editar trechos' }).click();
    const editor = page.getByTestId('editor-trechos');
    await editor.locator('#s-0').fill('abc');
    await editor.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(editor.getByText('Tempo inválido')).toBeVisible();
    await editor.locator('#s-0').fill('00:00:00.000');
    await editor.locator('#t-0').fill('   ');
    await editor.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(editor.getByText('O texto não pode ficar vazio')).toBeVisible();
    await editor.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.locator('button.cue').first()).toContainText(original); // cancelar não altera nada

    // Salva de verdade e confere no servidor e na tela.
    const novo = `Texto editado no E2E ${Date.now()}`;
    await editFirstCue(page, novo);
    await expect(page.locator('button.cue').first()).toContainText(novo);
    const txt = await (await page.request.get(`/api/transcriptions/${id}/export?format=txt`)).text();
    expect(txt.split('\n')[0]).toBe(novo);

    // Histórico (auditoria por entidade): a edição aparece, com quem fez.
    await page.getByRole('button', { name: 'Histórico' }).click();
    const linha = page.getByTestId('linha-do-tempo');
    await expect(linha.getByText('transcrição editada').first()).toBeVisible();
    await expect(linha.getByText(/por Admin/).first()).toBeVisible();

    // Persistiu: recarrega e o novo texto continua lá.
    await page.reload();
    await expect(page.locator('button.cue').first()).toContainText(novo);

    // Restaura o dado de demonstração.
    await page.waitForLoadState('networkidle');
    await editFirstCue(page, original);
    await expect(page.locator('button.cue').first()).toContainText(original);
  });

  test('o feed de Processamento mostra os eventos novos em português', async ({ page }) => {
    await loginAsAdmin(page);
    await nav(page).getByRole('link', { name: 'Processamento', exact: true }).click();
    const feed = page.getByTestId('atividade');
    await expect(feed.getByText('transcrição editada').first()).toBeVisible();
    await expect(feed).not.toContainText(/media\.(file|transcription)\./);
    await expect(feed).not.toContainText('identity.');
  });
});
