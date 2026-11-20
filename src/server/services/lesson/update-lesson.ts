import { prisma } from '../../utils/db';

export async function updateLessonInOurBase(
  iduser: string,
  idlesson: string,
  description: string,
  title: string,
  filePhoto?:
    | {
        size: string;
        type: string;
        name: string;
        lastModified: string;
        path: string;
      }
    | any,
  fileAudio?:
    | {
        size: string;
        type: string;
        name: string;
        lastModified: string;
        path: string;
      }
    | any,
  imagePath?: string,
  audioPath?: string,
) {
  const updateData: any = {
    updatedByUserId: iduser,
  };

  updateData.description = description;
  updateData.title = title;

  if (imagePath) {
    updateData.photoLeson = imagePath;
  }

  if (audioPath) {
    updateData.audiofile = audioPath;
  }

  const result = await prisma.mediaFile.update({
    where: {
      id: idlesson,
    },
    data: updateData,
    include: {
      files: true,
    },
  });

  if (filePhoto && filePhoto.type && filePhoto.type.includes('image') && result.files.length > 0) {
    const id = result.files[0].id;

    await prisma.file.update({
      where: { id: id },
      data: {
        size: JSON.stringify(filePhoto.size),
        type: filePhoto.type,
        name: filePhoto.name,
        lastModified: JSON.stringify(filePhoto.lastModified),
        path: filePhoto.path,
        updatedByUserId: iduser,
      },
    });
  }

  if (fileAudio && fileAudio.type && (fileAudio.type.includes('audio') || fileAudio.type.includes('video')) && result.files.length > 1) {
    const id = result.files[1].id;

    await prisma.file.update({
      where: { id: id },
      data: {
        size: JSON.stringify(fileAudio.size),
        type: fileAudio.type,
        name: fileAudio.name,
        lastModified: JSON.stringify(fileAudio.lastModified),
        path: fileAudio.path,
        updatedByUserId: iduser,
      },
    });
  }

  return result;
}
