import { prisma } from '../../utils/db';

interface SessionProps {
  id: string;
  user_id: string;
  expiresAt: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function createSession(info: SessionProps) {
  return await prisma.session.create({
    data: info,
  });
}
