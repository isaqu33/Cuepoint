import type { DomainEvent } from '../events/contracts';
import { eventLogData } from '../events/publish';
import { prisma } from '../utils/db';

/**
 * Transições de estado persistidas no PostgreSQL. `haveAnyTasncriptInProgresse`
 * (campo legado) acompanha o estado para as telas que ainda o leem.
 */
export const state = {
  queued: (lessonId: string) =>
    prisma.mediaFile.update({
      where: { id: lessonId },
      data: {
        transcriptionStatus: 'QUEUED',
        transcriptionProgress: 0,
        transcriptionError: null,
        haveAnyTasncriptInProgresse: true,
      },
    }),

  processing: (lessonId: string) =>
    prisma.mediaFile.update({
      where: { id: lessonId },
      data: {
        transcriptionStatus: 'PROCESSING',
        transcriptionError: null,
        haveAnyTasncriptInProgresse: true,
      },
    }),

  progress: (lessonId: string, percent: number) =>
    prisma.mediaFile.update({
      where: { id: lessonId },
      data: { transcriptionProgress: percent },
    }),

  /** Só marca READY na mesma transação que grava o resultado (upsert: sem duplicata em retry). */
  ready: (
    lessonId: string,
    userId: string,
    result: { html: string; vtt: string; language: string },
    event: DomainEvent,
    workspaceId?: string | null,
  ) =>
    prisma.$transaction([
      prisma.transcription.upsert({
        where: { lessonId },
        create: {
          lessonId,
          createdByUserId: userId,
          transcription: result.html,
          vtt: result.vtt,
          language: result.language,
        },
        update: {
          updatedByUserId: userId,
          transcription: result.html,
          vtt: result.vtt,
          language: result.language,
        },
      }),
      prisma.mediaFile.update({
        where: { id: lessonId },
        data: {
          transcriptionStatus: 'READY',
          transcriptionProgress: 100,
          transcriptionError: null,
          haveAnyTasncriptInProgresse: false,
        },
      }),
      // Evento durável gravado junto com o estado: nunca há "concluída" sem o fato registrado.
      prisma.eventLog.create({ data: eventLogData(event, workspaceId) }),
    ]),

  failed: (lessonId: string, message: string) =>
    prisma.mediaFile.update({
      where: { id: lessonId },
      data: {
        transcriptionStatus: 'FAILED',
        transcriptionError: message.slice(0, 500),
        haveAnyTasncriptInProgresse: false,
      },
    }),
};
