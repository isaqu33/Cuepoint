import { prisma } from '../../utils/db';

export async function deleteFile(idFile: string) {
  return await prisma.file.delete({
    where: {
      id: idFile,
    },
  });
}
