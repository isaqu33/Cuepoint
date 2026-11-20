import { prisma } from '../../utils/db';

export async function createSerie(
  idUser: string,
  lessonIds: string[],
  title: string,
  text: string,
  TagIds: string[],
  groupTagIds: string[],
  series: string[],
  imagempafh: string,
  file:
    | {
        size: string;
        type: string;
        name: string;
        lastModified: string;
        path: string;
      }
    | any,
) {
  const seriecreated = await prisma.subcollection.create({
    data: {
      title: title,
      about: text,
      createdByUserId: idUser,
      lessons: lessonIds.some((name) => typeof name === 'string' && name.trim() !== '')
        ? {
            connect: lessonIds
              .filter((name) => typeof name === 'string' && name.trim() !== '')
              .map((name) => ({ title: name })),
          }
        : undefined,
      tags: TagIds.some((id) => typeof id === 'string' && id.trim() !== '')
        ? {
            connect: TagIds.filter((id) => typeof id === 'string' && id.trim() !== '').map(
              (id) => ({ id }),
            ),
          }
        : undefined,
      grouptag: groupTagIds.some((id) => typeof id === 'string' && id.trim() !== '')
        ? {
            connect: groupTagIds
              .filter((id) => typeof id === 'string' && id.trim() !== '')
              .map((id) => ({ id })),
          }
        : undefined,
      series: series.some((name) => typeof name === 'string' && name.trim() !== '')
        ? {
            connect: series
              .filter((name) => typeof name === 'string' && name.trim() !== '')
              .map((name) => ({ title: name })),
          }
        : undefined,
      photoLeson: imagempafh,
      files: {
        create:
          file.size !== undefined
            ? {
                size: JSON.stringify(file.size),
                type: file.type,
                name: file.name,
                lastModified: JSON.stringify(file.lastModified),
                path: file.path,
                createdByUserId: idUser,
              }
            : undefined,
      },
    },
  });

  return seriecreated;
}
