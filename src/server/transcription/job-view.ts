import { prisma } from '../utils/db';

export type JobView = {
  id: string;
  status: 'IDLE' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';
  progress: number;
  error: string | null;
  terminal: boolean;
  links: { self: string };
};

/** Estado do job lido do PostgreSQL (fonte da verdade), não da fila: sobrevive a recarga e a reinício. */
export async function getJobView(lessonId: string): Promise<JobView | null> {
  const lesson = await prisma.mediaFile.findUnique({
    where: { id: lessonId },
    select: { transcriptionStatus: true, transcriptionProgress: true, transcriptionError: true },
  });
  if (!lesson) return null;
  const status = lesson.transcriptionStatus;
  return {
    id: lessonId,
    status,
    progress: lesson.transcriptionProgress,
    error: lesson.transcriptionError,
    terminal: status === 'READY' || status === 'FAILED' || status === 'IDLE',
    links: { self: `/api/jobs/${lessonId}` },
  };
}
