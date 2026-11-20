import { describe, expect, it } from 'vitest';
import {
  cuesToSrt, cuesToTxt, cuesToVtt, formatTimestamp, parseTimestamp, parseVttToCues, renderTranscription, safeFilename, validateCues,
} from './subtitles';

const cues = [
  { startMs: 0, endMs: 5960, text: 'Bem-vindos ao Cuepoint,' },
  { startMs: 5960, endMs: 3_723_500, text: 'segunda\nlinha  com   espaços' },
];

describe('tempos', () => {
  it('formata VTT com ponto e SRT com vírgula', () => {
    expect(formatTimestamp(3_723_500)).toBe('01:02:03.500');
    expect(formatTimestamp(3_723_500, ',')).toBe('01:02:03,500');
    expect(formatTimestamp(-5)).toBe('00:00:00.000');
  });
  it('lê hh:mm:ss.mmm, mm:ss e vírgula; recusa lixo', () => {
    expect(parseTimestamp('01:02:03.500')).toBe(3_723_500);
    expect(parseTimestamp('02:03,5')).toBe(123_500);
    expect(parseTimestamp('00:61:00')).toBeNull();
    expect(parseTimestamp('abc')).toBeNull();
  });
  it('ida e volta sem perda', () => {
    for (const ms of [0, 1, 999, 61_001, 86_399_999]) expect(parseTimestamp(formatTimestamp(ms))).toBe(ms);
  });
});

describe('formatos', () => {
  it('VTT tem cabeçalho e uma linha de texto por trecho', () => {
    expect(cuesToVtt(cues)).toBe('WEBVTT\n\n00:00:00.000 --> 00:00:05.960\nBem-vindos ao Cuepoint,\n\n00:00:05.960 --> 01:02:03.500\nsegunda linha com espaços\n');
  });
  it('SRT numera e usa vírgula', () => {
    expect(cuesToSrt(cues)).toBe('1\n00:00:00,000 --> 00:00:05,960\nBem-vindos ao Cuepoint,\n\n2\n00:00:05,960 --> 01:02:03,500\nsegunda linha com espaços\n');
  });
  it('TXT é só o texto, um trecho por linha', () => {
    expect(cuesToTxt(cues)).toBe('Bem-vindos ao Cuepoint,\nsegunda linha com espaços\n');
  });
  it('VTT → trechos → VTT é estável (o que o whisper grava volta igual)', () => {
    const vtt = cuesToVtt(cues);
    expect(cuesToVtt(parseVttToCues(vtt))).toBe(vtt);
  });
  it('renderTranscription devolve VTT e HTML escapado', () => {
    const r = renderTranscription([{ startMs: 0, endMs: 1000, text: 'a <b> & c' }]);
    expect(r.html).toBe('<p>a &lt;b&gt; &amp; c</p>');
    expect(r.vtt).toContain('a <b> & c');
  });
});

describe('validateCues', () => {
  it('aceita trechos coerentes e normaliza o texto', () => {
    const v = validateCues([{ startMs: 0, endMs: 10, text: '  oi   mundo ' }]);
    expect(v).toEqual({ ok: true, cues: [{ startMs: 0, endMs: 10, text: 'oi mundo' }] });
  });
  it.each([
    [[], 'ao menos um'],
    [[{ startMs: 0, endMs: 10, text: '   ' }], 'não pode ficar vazio'],
    [[{ startMs: 10, endMs: 10, text: 'a' }], 'depois do início'],
    [[{ startMs: -1, endMs: 10, text: 'a' }], 'depois do início'],
    [[{ startMs: 5, endMs: 9, text: 'a' }, { startMs: 1, endMs: 3, text: 'b' }], 'ordem do tempo'],
    [[{ startMs: 'x', endMs: 9, text: 'a' }], 'dados inválidos'],
    ['texto', 'ao menos um'],
  ])('recusa %#', (input, fragment) => {
    const v = validateCues(input);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.message).toContain(fragment);
  });
});

describe('safeFilename', () => {
  it('tira acentos e símbolos', () => {
    expect(safeFilename('Discurso de posse (amostra) — Ação!', 'srt')).toBe('Discurso-de-posse-amostra-Acao.srt');
    expect(safeFilename('///', 'txt')).toBe('transcricao.txt');
  });
});
