import { prisma } from '../../utils/db';

export async function editSerie(
  userId: string,
  lessons: string,
  title: string,
  about: string,
  serieId: string,
  photoLeson?: string,
  filePhoto?:
    | {
        size: string;
        type: string;
        name: string;
        lastModified: string;
        path: string;
      }
    | any,
) {
  const lessonIds = await Promise.all(
    lessons
      .split(',')
      .filter(Boolean)
      .map(async (lessonTitle) => {
        const lesson = await prisma.mediaFile.findFirst({
          where: { title: lessonTitle },
        });
        return lesson?.id;
      }),
  );

  const updateData: any = {
    title,
    about,
    lessons: {
      set: lessonIds.filter(Boolean).map((id) => ({ id })),
    },
  };

  if (photoLeson) {
    updateData.photoLeson = photoLeson;
  }

  const updatedSerie = await prisma.subcollection.update({
    where: { id: serieId },
    data: updateData,
    include: {
      lessons: true,
      files: true,
    },
  });

  if (
    filePhoto &&
    filePhoto.type &&
    filePhoto.type.includes('image') &&
    updatedSerie.files.length > 0
  ) {
    const id = updatedSerie.files[0].id;

    await prisma.file.update({
      where: { id: id },
      data: {
        size: JSON.stringify(filePhoto.size),
        type: filePhoto.type,
        name: filePhoto.name,
        lastModified: JSON.stringify(filePhoto.lastModified),
        path: filePhoto.path,
        updatedByUserId: userId,
      },
    });
  }

  return updatedSerie;
}
