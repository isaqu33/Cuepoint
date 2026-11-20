import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { createlessonbyid } from '../../../../../server/services/lesson/create-lesson.js';
import { getLessontoEditByTitle } from '../../../../../server/services/lesson/verify-title-exits';
import { ObjectStorageAdapter } from '../../../../../utils/object-storage';
import { emit } from '../../../../../server/events/publish';
import { createLessonFromUploads } from '../../../../../server/lesson/create-from-uploads';

export async function createLessonServer(
  { request, locals }: RequestEvent,
  deps = { z },
): Promise<object> {
  const infoUserLogged = await locals.user;

  const formData = await request.formData();

  const Title = (await formData?.get('Title')?.toString()) ?? '';
  const description = (await formData?.get('description')?.toString()) ?? '';
  const photo = (await formData.get('image')) as File;
  const audio = (await formData?.get('audio')) as File;

  const audioKey = formData.get('audioKey');
  const imageKey = formData.get('imageKey');
  const directUpload = typeof audioKey === 'string' && audioKey !== '' && typeof imageKey === 'string' && imageKey !== '';

  const VerifyTitleExits = await getLessontoEditByTitle(Title);

  if (VerifyTitleExits !== null) {
    return {
      status: 555,
      type: 'titleExists',
      statusText: 'Já existe um item com esse título. Escolha outro.',
    };
  }

  // Envio direto ao storage: o navegador já subiu os arquivos; aqui só conferimos e salvamos as URLs.
  if (directUpload && infoUserLogged) {
    const created = await createLessonFromUploads({
      userId: infoUserLogged.id,
      title: Title,
      description,
      imageKey,
      audioKey,
      imageName: formData.get('imageName')?.toString(),
      audioName: formData.get('audioName')?.toString(),
    });
    if (created.ok) return { status: 200, statusText: '✅ Ação concluída com sucesso' };
    return { status: 555, statusText: `⛔ ${created.message}` };
  }

  const azureBlob = new ObjectStorageAdapter('lessons');

  const lessonId = uuidv4();

  // ------------------ Upload da Imagem ------------------
  const imageFileName = `lesson_${lessonId}.jpeg`;

  const imageBuffer = Buffer.from(await photo.arrayBuffer());

  const imageUrl = await azureBlob.uploadFile(imageBuffer, imageFileName);

  // ------------------ Upload do Áudio ------------------
  const audioFileName = `audio_${lessonId}.mp3`;

  const audioBuffer = Buffer.from(await audio.arrayBuffer());

  const audioUrl = await azureBlob.uploadFile(audioBuffer, audioFileName);

  if (infoUserLogged !== null) {
    const createlesson = await createlessonbyid(
      infoUserLogged.id,
      Title,
      description,
      imageUrl,
      audioUrl,
      [
        {
          size: photo.size.toString(),
          type: photo.type,
          name: photo.name,
          lastModified: photo.lastModified.toString(),
          path: imageUrl,
        },
        {
          size: audio.size.toString(),
          type: audio.type,
          name: audio.name,
          lastModified: audio.lastModified.toString(),
          path: audioUrl,
        },
      ],
    );

    if (createlesson !== null) {
      await emit('media.file.uploaded', createlesson.id, { lessonId: createlesson.id, userId: infoUserLogged.id, audioBytes: audio.size }).catch(() => undefined);
      return {
        status: 200,
        statusText: '✅ Ação concluída com sucesso',
      };
    }
  }
  return {
    status: 555,
    statusText: '⛔ Não foi possível concluir a ação',
  };
}
