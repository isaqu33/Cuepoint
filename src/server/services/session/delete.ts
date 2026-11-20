import { prisma } from '../../utils/db';

export async function deleteSession(sessionId: string) {
  return await prisma.session.delete({ where: { id: sessionId } });
}
