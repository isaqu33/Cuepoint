import { plainTextToHtml } from './text';

/** Trecho com tempos em milissegundos: formato de trabalho da edição e da exportação. */
export interface TimedCue {
  startMs: number;
  endMs: number;
  text: string;
}

export const MAX_CUES = 5000;
export const MAX_CUE_TEXT = 2000;

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0');

/** 3_723_500 → "01:02:03.500" (VTT) ou "01:02:03,500" (SRT). */
export function formatTimestamp(ms: number, sep: '.' | ',' = '.'): string {
  const total = Math.max(0, Math.round(ms));
  const h = total / 3_600_000;
  const m = (total % 3_600_000) / 60_000;
  const s = (total % 60_000) / 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(total % 1000, 3)}`;
}

/** Aceita "hh:mm:ss.mmm", "mm:ss.mmm" e vírgula decimal. Devolve null se não for um tempo válido. */
export function parseTimestamp(input: string): number | null {
  const m = input.trim().match(/^(?:(\d{1,3}):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/);
  if (!m) return null;
  const [, h = '0', mi, s, frac = '0'] = m;
  if (Number(mi) > 59 || Number(s) > 59) return null;
  return ((Number(h) * 60 + Number(mi)) * 60 + Number(s)) * 1000 + Number(frac.padEnd(3, '0'));
}

/** WebVTT → trechos em ms (lê o que o whisper grava e o que a edição regrava). */
export function parseVttToCues(vtt: string): TimedCue[] {
  const cues: TimedCue[] = [];
  for (const block of vtt.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/).filter((l) => l.length);
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at === -1) continue;
    const [a, b] = lines[at].split('-->').map((s) => s.trim().split(/\s/)[0]);
    const startMs = parseTimestamp(a);
    const endMs = parseTimestamp(b);
    const text = lines.slice(at + 1).join(' ').trim();
    if (startMs !== null && endMs !== null && text) cues.push({ startMs, endMs, text });
  }
  return cues;
}

const cleanText = (t: string) => t.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();

export function cuesToVtt(cues: TimedCue[]): string {
  const body = cues.map((c) => `${formatTimestamp(c.startMs)} --> ${formatTimestamp(c.endMs)}\n${cleanText(c.text)}`);
  return `WEBVTT\n\n${body.join('\n\n')}\n`;
}

export function cuesToSrt(cues: TimedCue[]): string {
  const body = cues.map(
    (c, i) => `${i + 1}\n${formatTimestamp(c.startMs, ',')} --> ${formatTimestamp(c.endMs, ',')}\n${cleanText(c.text)}`,
  );
  return `${body.join('\n\n')}\n`;
}

export const cuesToTxt = (cues: TimedCue[]): string => `${cues.map((c) => cleanText(c.text)).join('\n')}\n`;

export type CueValidation = { ok: true; cues: TimedCue[] } | { ok: false; message: string };

/** Valida o que veio do cliente: limites, tempos coerentes e ordem. Normaliza o texto. */
export function validateCues(input: unknown): CueValidation {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, message: 'Envie ao menos um trecho' };
  if (input.length > MAX_CUES) return { ok: false, message: `No máximo ${MAX_CUES} trechos` };
  const cues: TimedCue[] = [];
  for (let i = 0; i < input.length; i++) {
    const c = input[i] as Partial<TimedCue> | null;
    const n = i + 1;
    if (!c || !Number.isFinite(c.startMs) || !Number.isFinite(c.endMs) || typeof c.text !== 'string') {
      return { ok: false, message: `Trecho ${n}: dados inválidos` };
    }
    const startMs = Math.round(c.startMs as number);
    const endMs = Math.round(c.endMs as number);
    const text = cleanText(c.text);
    if (!text) return { ok: false, message: `Trecho ${n}: o texto não pode ficar vazio` };
    if (text.length > MAX_CUE_TEXT) return { ok: false, message: `Trecho ${n}: texto longo demais` };
    if (startMs < 0 || endMs <= startMs) return { ok: false, message: `Trecho ${n}: o fim deve ser depois do início` };
    if (cues.length && startMs < cues[cues.length - 1].startMs) {
      return { ok: false, message: `Trecho ${n}: os trechos devem seguir a ordem do tempo` };
    }
    cues.push({ startMs, endMs, text });
  }
  return { ok: true, cues };
}

/** Tudo que precisa ser regravado a partir dos trechos editados. */
export function renderTranscription(cues: TimedCue[]) {
  return { vtt: cuesToVtt(cues), html: plainTextToHtml(cuesToTxt(cues)) };
}

export const EXPORT_FORMATS = {
  txt: { mime: 'text/plain; charset=utf-8', render: cuesToTxt },
  srt: { mime: 'application/x-subrip; charset=utf-8', render: cuesToSrt },
  vtt: { mime: 'text/vtt; charset=utf-8', render: cuesToVtt },
} as const;
export type ExportFormat = keyof typeof EXPORT_FORMATS;

/** Nome de arquivo seguro a partir do título (sem acentos nem caracteres especiais). */
export function safeFilename(title: string, ext: string): string {
  const base = title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return `${base || 'transcricao'}.${ext}`;
}
