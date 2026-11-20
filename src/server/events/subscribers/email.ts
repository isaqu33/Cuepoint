import Redis from 'ioredis';
import { notifyTranscriptionReady } from '../../transcription/notify';
import { transcriptionConfig } from '../../transcription/config';
import { prisma } from '../../utils/db';
import type { EventBus } from '../bus';

/** Avisa por e-mail quando uma transcrição termina. Idempotente por id de evento. */
export async function startEmailSubscriber(bus: EventBus) {
  const redis = new Redis(transcriptionConfig().redis);
  const unsubscribe = await bus.subscribe(
    'email',
    async (event) => {
      if (event.type !== 'media.transcription.completed') return;

      // Mesma mensagem entregue duas vezes? Só a primeira envia.
      const first = await redis.set(`cuepoint:email:${event.id}`, '1', 'EX', 86_400, 'NX');
      if (first !== 'OK') return;

      const [user, lesson] = await Promise.all([
        prisma.user.findUnique({ where: { id: event.data.userId } }),
        prisma.mediaFile.findUnique({ where: { id: event.data.lessonId }, select: { title: true } }),
      ]);
      if (user?.email && lesson) await notifyTranscriptionReady(user.email, user.name ?? user.username, lesson.title);
    },
    ['media.transcription.completed'],
  );
  return async () => {
    await unsubscribe();
    redis.disconnect();
  };
}
