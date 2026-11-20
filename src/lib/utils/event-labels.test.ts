import { describe, expect, it } from 'vitest';
import { eventDetail, eventLabel, EVENT_LABELS } from './event-labels';
import { DURABLE } from '../../server/events/contracts';

describe('rótulos de eventos', () => {
  it('todo evento durável tem rótulo (nenhum aparece em inglês no feed)', () => {
    for (const type of Object.keys(DURABLE).filter((t) => DURABLE[t as keyof typeof DURABLE])) {
      expect(EVENT_LABELS[type], type).toBeDefined();
    }
  });
  it('tipo desconhecido cai no neutro, sem quebrar', () => {
    expect(eventLabel('x.y')).toEqual({ text: 'x.y', tone: 'pill-idle' });
  });
  it('detalhes em português', () => {
    expect(eventDetail('media.file.deleted', { reason: 'retention' })).toBe('pela política de retenção');
    expect(eventDetail('media.file.uploaded', { audioBytes: 3 * 1024 ** 2 })).toBe('3.0 MB');
    expect(eventDetail('media.transcription.edited', { cues: 12 })).toBe('12 trecho(s)');
  });
});
