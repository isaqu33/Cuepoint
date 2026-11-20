import Redis from 'ioredis';
import { transcriptionConfig } from './config';

export type StoredCue = { index: number; startMs: number; endMs: number; text: string };

const key = (lessonId: string) => `cuepoint:cues:${lessonId}`;
const TTL_SECONDS = 3600;
const MAX_CUES = 2000;

let redis: Redis | undefined;
const conn = () => (redis ??= new Redis(transcriptionConfig().redis));

/**
 * Buffer curto dos trechos já transcritos DESTA execução (Redis, com validade): permite que um navegador que
 * conecta (ou reconecta) no meio veja o que já saiu. O resultado final e durável é o VTT gravado no PostgreSQL.
 */
export async function pushCue(lessonId: string, cue: StoredCue & { lessonId?: string }) {
  const { index, startMs, endMs, text } = cue;
  await conn()
    .multi()
    .rpush(key(lessonId), JSON.stringify({ index, startMs, endMs, text }))
    .ltrim(key(lessonId), -MAX_CUES, -1)
    .expire(key(lessonId), TTL_SECONDS)
    .exec();
}

export async function readCues(lessonId: string): Promise<StoredCue[]> {
  const raw = await conn().lrange(key(lessonId), 0, -1);
  return raw.flatMap((r) => {
    try {
      return [JSON.parse(r) as StoredCue];
    } catch {
      return [];
    }
  });
}

export const clearCues = async (lessonId: string) => void (await conn().del(key(lessonId)));
