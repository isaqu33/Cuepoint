import { prisma } from '../../utils/db';

export const deleteSerie = async (idSerie: string) => {
  return await prisma.subcollection.delete({
    where: {
      id: idSerie,
    },
  });
};

export async function deletSerieInOurBase(idSerie: string) {
  return await deleteSerie(idSerie);
}
