import { describe, expect, it } from 'vitest';
import { buildEvent } from './contracts';
import { jobFrameFor, sseFrame } from './sse';

const id = 'aula-1';
const u = { lessonId: id, userId: 'u1' };

describe('SSE', () => {
  it('monta o quadro com id, evento e dado em JSON', () => {
    expect(sseFrame('progress', { progress: 40 }, 'abc')).toBe('id: abc\nevent: progress\ndata: {"progress":40}\n\n');
    expect(sseFrame('snapshot', { a: 1 })).toBe('event: snapshot\ndata: {"a":1}\n\n');
  });

  it('progresso não é terminal; concluída é', () => {
    const p = jobFrameFor(buildEvent('media.transcription.progress', id, { lessonId: id, percent: 42 }));
    expect(p).toMatchObject({ name: 'progress', data: { progress: 42 }, terminal: false });
    const c = jobFrameFor(buildEvent('media.transcription.completed', id, { ...u, durationMs: 10, language: 'pt' }));
    expect(c).toMatchObject({ data: { status: 'READY' }, terminal: true });
  });

  it('falha com nova tentativa volta a QUEUED e não encerra; falha final encerra', () => {
    const retry = jobFrameFor(buildEvent('media.transcription.failed', id, { ...u, error: 'x', attempt: 1, final: false }));
    expect(retry).toMatchObject({ data: { status: 'QUEUED' }, terminal: false });
    const fin = jobFrameFor(buildEvent('media.transcription.failed', id, { ...u, error: 'x', attempt: 3, final: true }));
    expect(fin).toMatchObject({ data: { status: 'FAILED' }, terminal: true });
  });

  it('cue vira quadro `cue` sem expor o envelope e não é terminal', () => {
    const f = jobFrameFor(buildEvent('media.transcription.cue', id, { lessonId: id, index: 3, startMs: 1000, endMs: 2500, text: 'Olá' }));
    expect(f).toEqual({ name: 'cue', data: { index: 3, startMs: 1000, endMs: 2500, text: 'Olá' }, terminal: false });
  });

  it('não vaza o envelope interno ao navegador', () => {
    const f = jobFrameFor(buildEvent('media.transcription.started', id, { ...u, attempt: 2 }))!;
    expect(JSON.stringify(f.data)).not.toContain('userId');
    expect(f.data).toEqual({ status: 'PROCESSING', attempt: 2 });
  });
});
