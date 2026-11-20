import { prisma } from '../../utils/db';

export async function deleteTrnascribe(id: string) {
  return await prisma.transcription.delete({
    where: {
      id,
    },
  });
}
