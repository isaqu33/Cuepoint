import { prisma } from '../../utils/db';

export async function getFile(idFile: string) {
  return await prisma.file.findFirst({
    where: {
      id: idFile,
    },
  });
}
