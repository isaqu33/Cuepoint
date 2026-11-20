import { prisma } from '../../utils/db';

export async function findSession(sessionId: string) {
  return await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: true,
    },
  });
}
