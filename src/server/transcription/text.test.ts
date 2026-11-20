import { describe, expect, it } from 'vitest';
import { parseProgress, parseVtt, plainTextToHtml } from './text';

describe('parseProgress', () => {
  it('lê o percentual do whisper-cli', () => {
    expect(parseProgress('whisper_print_progress_callback: progress =  42%')).toBe(42);
  });
  it('ignora linhas sem progresso ou fora de faixa', () => {
    expect(parseProgress('loading model')).toBeNull();
    expect(parseProgress('progress = 250%')).toBeNull();
  });
});

describe('plainTextToHtml', () => {
  it('cria parágrafos e escapa HTML', () => {
    expect(plainTextToHtml(' Olá <b>\n\n mundo ')).toBe('<p>Olá &lt;b&gt;</p><p>mundo</p>');
  });
});

describe('parseVtt', () => {
  it('extrai cues com tempo', () => {
    const vtt = 'WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nOlá mundo\n\n00:00:02.500 --> 00:00:05.000\nSegunda fala\n';
    expect(parseVtt(vtt)).toEqual([
      { start: '00:00:00.000', end: '00:00:02.500', text: 'Olá mundo' },
      { start: '00:00:02.500', end: '00:00:05.000', text: 'Segunda fala' },
    ]);
  });
});

import { parseCueLine } from './text';

describe('parseCueLine', () => {
  it('lê o segmento do whisper com tempos em ms', () => {
    expect(parseCueLine('[00:01:02.500 --> 00:01:05.040]   Olá, tudo bem?')).toEqual({
      startMs: 62_500,
      endMs: 65_040,
      text: 'Olá, tudo bem?',
    });
  });
  it('ignora linhas que não são segmentos e tempos invertidos', () => {
    expect(parseCueLine('whisper_print_timings: total = 10 ms')).toBeNull();
    expect(parseCueLine('[00:00:05.000 --> 00:00:01.000]  x')).toBeNull();
    expect(parseCueLine('[00:00:00.000 --> 00:00:01.000]   ')).toBeNull();
  });
});
