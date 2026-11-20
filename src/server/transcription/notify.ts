import { Resend } from 'resend';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Avisa o solicitante. Falha de e-mail não invalida a transcrição já gravada. */
export async function notifyTranscriptionReady(
  to: string,
  name: string,
  lessonTitle: string,
): Promise<void> {
  const key = process.env.APP_RESEND_EMAIL_KEY;
  const from = process.env.APP_RESEND_EMAIL_FROM;
  if (!key || !from) return;

  const base = (process.env.APP_HOST_EMAIL ?? '').replace(/\/$/, '');
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1E1B4B">
    <h2 style="margin:0 0 12px">Sua transcrição está pronta</h2>
    <p>Olá, ${esc(name)}. A transcrição de <strong>${esc(lessonTitle)}</strong> foi concluída e já pode ser revisada no Cuepoint.</p>
    ${base ? `<p><a href="${esc(base)}/admin/lessons" style="display:inline-block;background:#3730A3;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">Abrir no Cuepoint</a></p>` : ''}
    <p style="color:#64748B;font-size:13px">Equipe Cuepoint</p></div>`;

  const { error } = await new Resend(key).emails.send({
    from,
    to,
    subject: `Transcrição concluída — ${lessonTitle} · Cuepoint`,
    html,
  });
  if (error) console.warn('[notify] falha ao enviar e-mail:', error);
}
