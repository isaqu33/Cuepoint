const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Texto puro do whisper → HTML de parágrafos (o editor de revisão consome HTML). */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join('');
}

/** Extrai o percentual de uma linha de progresso do whisper-cli (`progress =  42%`). */
export function parseProgress(line: string): number | null {
  const m = line.match(/progress\s*=\s*(\d{1,3})%/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 0 && n <= 100 ? n : null;
}

export interface Cue {
  start: string;
  end: string;
  text: string;
}

/** Lê WebVTT em cues (início, fim, texto) para exibição/revisão com tempo. */
export function parseVtt(vtt: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of vtt.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/).filter(Boolean);
    const timing = lines.findIndex((l) => l.includes('-->'));
    if (timing === -1) continue;
    const [start, end] = lines[timing].split('-->').map((s) => s.trim().split(/\s/)[0]);
    const text = lines.slice(timing + 1).join(' ').trim();
    if (text) cues.push({ start, end, text });
  }
  return cues;
}

export interface LiveCue {
  startMs: number;
  endMs: number;
  text: string;
}

const toMs = (h: string, m: string, s: string, ms: string) =>
  ((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000 + Number(ms.padEnd(3, '0').slice(0, 3));

/** Lê uma linha de segmento do whisper-cli: `[00:00:01.000 --> 00:00:03.500]   texto`. */
export function parseCueLine(line: string): LiveCue | null {
  const m = line.match(
    /^\s*\[(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\]\s*(.*\S)\s*$/,
  );
  if (!m) return null;
  const startMs = toMs(m[1], m[2], m[3], m[4]);
  const endMs = toMs(m[5], m[6], m[7], m[8]);
  return endMs >= startMs ? { startMs, endMs, text: m[9] } : null;
}
