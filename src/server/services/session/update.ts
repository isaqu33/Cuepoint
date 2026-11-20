import { prisma } from '../../utils/db';

interface SessionProps {
  id: string;
  expiresAt: Date;
}

export async function updateSession(info: SessionProps) {
  return await prisma.session.update({
    where: {
      id: info.id,
    },
    data: {
      expiresAt: info.expiresAt,
    },
  });
}
