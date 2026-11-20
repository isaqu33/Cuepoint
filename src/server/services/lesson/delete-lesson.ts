import { prisma } from '../../utils/db';
import { getLessontoEdit } from './get-leeson-to-edit';
import { ObjectStorageAdapter } from '../../../utils/object-storage';

export async function deletLessonInOurBase(idLesson: string) {
  const lesson = await getLessontoEdit(idLesson);
  if (!lesson) return null;

  const azureBlob = new ObjectStorageAdapter('lessons');

  const blobImageName = lesson.photoLeson ? lesson.photoLeson.split('?')[0].split('/').pop() : null;

  const blobAudioName = lesson.audiofile ? lesson.audiofile.split('?')[0].split('/').pop() : null;

  if (blobImageName) {
    await azureBlob.deleteBlobIfExists(blobImageName);
  }

  if (blobAudioName) {
    await azureBlob.deleteBlobIfExists(blobAudioName);
  }

  if (lesson.transcript?.id) {
    await prisma.transcription.delete({
      where: { id: lesson.transcript.id },
    });
  }

  return prisma.mediaFile.delete({
    where: { id: idLesson },
  });
}
