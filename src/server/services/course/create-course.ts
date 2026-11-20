import { prisma } from '../../utils/db';

export async function createCourse(
  iduser: string,
  title: string,
  text: string,
  seriesIds: string[],
  imagempafh: string,
  file:
    | {
        size: string;
        type: string;
        name: string;
        lastModified: string;
        path: string;
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | any,
) {
  const seriecreated = await prisma.collection.create({
    data: {
      title: title,
      about: text,
      createdByUserId: iduser,
      series: seriesIds.some((name) => typeof name === 'string' && name.trim() !== '')
        ? {
            connect: seriesIds
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
                createdByUserId: iduser,
              }
            : undefined,
      },
    },
  });

  return seriecreated;
}
