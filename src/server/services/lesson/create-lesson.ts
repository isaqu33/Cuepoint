import { prisma } from '../../utils/db';

export async function createlessonbyid(
  iduser: string,
  title: string,
  description: string,
  imagempafh: string,
  audiopafh: string,
  file: {
    size: string;
    type: string;
    name: string;
    lastModified: string;
    path: string;
  }[],
  sizeBytes = 0,
) {
  const lessonCreated = await prisma.mediaFile.create({
    data: {
      title: title,
      description: description,
      photoLeson: imagempafh,
      audiofile: audiopafh,
      sizeBytes: BigInt(Math.max(0, Math.round(sizeBytes))),
      createdByUserId: iduser,

      files: {
        create: file.map((file) => ({
          size: JSON.stringify(file.size),
          type: file.type,
          name: file.name,
          lastModified: JSON.stringify(file.lastModified),
          path: file.path,
          createdByUserId: iduser,
        })),
      },
      userid: iduser,
    },
    include: {
      user: true,
    },
  });

  return lessonCreated;
}
