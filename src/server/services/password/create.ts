import { prisma } from '../../utils/db';

export async function createPassword({ idUser, password }: { idUser: string; password: string }) {
  return await prisma.password.create({
    data: {
      hashed_password: password,
      user_id: idUser,
    },
  });
}
