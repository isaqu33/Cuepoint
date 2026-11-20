import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/** Abre o painel e espera o formulário interno carregar e hidratar (no dev a 1ª carga é lenta). */
async function openPanel(page: Page, button: string, title: string): Promise<FrameLocator> {
  await page.getByRole('button', { name: button }).first().click();
  const handle = await page.locator(`iframe[title="${title}"]`).elementHandle();
  const frame = await handle!.contentFrame();
  await frame!.waitForLoadState('networkidle');
  return page.frameLocator(`iframe[title="${title}"]`);
}

/** Solta um arquivo sintético sobre o seletor (simula arrastar do Finder/Explorer). */
async function dropFile(frame: FrameLocator, target: string, file: { name: string; type: string; b64?: string }) {
  await frame.locator(target).evaluate((el, { name, type, b64 }) => {
    const bytes = b64 ? Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) : new Uint8Array(64);
    const data = new DataTransfer();
    data.items.add(new File([bytes], name, { type }));
    el.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }));
  }, file);
}

test.describe('Controles de formulário no painel', () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test('arrastar e soltar um áudio mostra o nome e o player', async ({ page }) => {
    await page.goto('/admin/lessons');
    const form = await openPanel(page, 'Novo arquivo', 'Novo arquivo');
    await expect(form.getByText('Arraste o áudio ou vídeo ou clique para enviar')).toBeVisible();

    await dropFile(form, 'label[for="audio"]', { name: 'amostra.mp3', type: 'audio/mpeg' });
    await expect(form.getByText('amostra.mp3')).toBeVisible();
    await expect(form.locator('.plyr, audio').first()).toBeAttached();
  });

  test('formato de áudio não suportado é recusado com mensagem', async ({ page }) => {
    await page.goto('/admin/lessons');
    const form = await openPanel(page, 'Novo arquivo', 'Novo arquivo');
    await dropFile(form, 'label[for="audio"]', { name: 'notas.txt', type: 'text/plain' });
    await expect(form.getByText('Formato não suportado. Use MP3, WAV, OGG, M4A ou vídeo (MP4, MOV, WEBM).')).toBeVisible();
    await expect(form.getByText('notas.txt')).toHaveCount(0);
  });

  test('arrastar e soltar uma imagem mostra a prévia', async ({ page }) => {
    await page.goto('/admin/courses');
    const form = await openPanel(page, 'Nova coleção', 'Nova coleção');
    await dropFile(form, 'label[for="photo"]', { name: 'capa.png', type: 'image/png', b64: PNG_B64 });
    await expect(form.getByAltText('Prévia da imagem selecionada')).toBeVisible();
    await expect(form.getByText('capa.png')).toBeVisible();
  });

  test('em tela baixa o conteúdo rola e o rodapé nunca cobre os campos', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 520 });
    await page.goto('/admin/courses');
    const form = await openPanel(page, 'Nova coleção', 'Nova coleção');

    const body = form.locator('.form-body');
    await expect(body).toBeVisible();
    const scrollable = await body.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(scrollable).toBe(true);

    // Rodapé sempre visível.
    await expect(form.getByRole('button', { name: 'Criar' })).toBeInViewport();

    // Rola até o fim: o último campo fica totalmente acima do rodapé.
    await body.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    const picker = await form.locator('label[for="photo"]').boundingBox();
    const footer = await form.locator('.form-footer').boundingBox();
    expect(picker && footer).toBeTruthy();
    expect(picker!.y + picker!.height).toBeLessThanOrEqual(footer!.y + 1);
  });
});
