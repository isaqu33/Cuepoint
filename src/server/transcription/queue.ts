import Queue from 'bull';
import {
  TRANSCRIPTION_QUEUE,
  jobIdFor,
  transcriptionJobSchema,
  type TranscriptionJob,
} from './contracts';
import { transcriptionConfig } from './config';

let queue: Queue.Queue<TranscriptionJob> | undefined;

/** Instância única (lazy) da fila; usada pelo web para enfileirar e pelo worker para consumir. */
export function getTranscriptionQueue(): Queue.Queue<TranscriptionJob> {
  if (!queue) {
    const cfg = transcriptionConfig();
    queue = new Queue<TranscriptionJob>(TRANSCRIPTION_QUEUE, {
      redis: cfg.redis,
      defaultJobOptions: {
        attempts: cfg.attempts,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true,
        // Mantém só os últimos jobs falhos (o estado e o erro ficam no PostgreSQL); a rotina noturna limpa os antigos.
        removeOnFail: 500,
      },
    });
  }
  return queue;
}

/**
 * Enfileira a transcrição de uma aula de forma idempotente: se já existe um job
 * ativo para a aula, não cria outro. Jobs terminais (falhos) são substituídos,
 * o que torna o "reprocessar" seguro.
 */
export async function enqueueTranscription(
  input: TranscriptionJob,
): Promise<{ enqueued: boolean }> {
  const payload = transcriptionJobSchema.parse(input);
  const q = getTranscriptionQueue();
  const jobId = jobIdFor(payload.lessonId);

  const existing = await q.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'failed' || state === 'completed') {
      await existing.remove();
    } else {
      return { enqueued: false };
    }
  }

  await q.add(payload, { jobId });
  return { enqueued: true };
}
