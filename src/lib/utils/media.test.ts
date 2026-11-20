import { describe, expect, it } from 'vitest';
import { isVideoMedia } from './media';

describe('isVideoMedia', () => {
  it('o tipo de mídia manda quando conhecido (webm pode ser áudio ou vídeo)', () => {
    expect(isVideoMedia('x.webm', 'video/webm')).toBe(true);
    expect(isVideoMedia('x.webm', 'audio/webm')).toBe(false);
  });
  it('sem tipo, decide pela extensão, ignorando a query', () => {
    expect(isVideoMedia('http://s/lessons/audio_1.mp4?X-Amz=1')).toBe(true);
    expect(isVideoMedia('http://s/lessons/audio_1.mp3')).toBe(false);
    expect(isVideoMedia(null)).toBe(false);
  });
});
