import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { updateLessonInOurBase } from '../../../../../../server/services/lesson/update-lesson';
import { getLessontoEdit } from '../../../../../../server/services/lesson/get-leeson-to-edit';
import type { lessonType } from '../../../types';
import { getLessonByName } from '../../../../../../server/services/lesson/admin/get-by-name';
import { ObjectStorageAdapter } from '../../../../../../utils/object-storage';
import { recomputeSizeBytes, verifyReplacement } from '../../../../../../server/lesson/replace-media';

export async function updateLessonServer(
  { request, locals }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const infoUserLogged = await locals.user;

  const formData = await request.formData();
  const idLesson = formData?.get('id')?.toString() ?? '';
  const Title = (await formData?.get('Title')?.toString()) ?? '';
  const description = (await formData?.get('description')?.toString()) ?? '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photo = (await formData.get('image')) as File | any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audio = (await formData?.get('audio')) as File | any;

  // Envio direto: o navegador já subiu os arquivos novos ao storage e manda só as chaves.
  const imageKey = formData.get('imageKey')?.toString() || null;
  const audioKey = formData.get('audioKey')?.toString() || null;
  const direct = !!(imageKey || audioKey);

  const isPhotoFile = typeof photo !== 'string' && photo instanceof File;
  const isAudioFile = typeof audio !== 'string' && audio instanceof File;

  const leson: lessonType = (await getLessontoEdit(idLesson)) as unknown as lessonType;
  const existingTitleInDataBase = await getLessonByName(Title);

  const titleChanged = leson.title !== Title;
  const descriptionChanged = leson.description !== description;

  if (!titleChanged && !descriptionChanged && !isPhotoFile && !isAudioFile && !direct) {
    return {
      status: 555,
      type: 'generalError',
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  if (existingTitleInDataBase && leson?.title !== Title) {
    return {
      status: 555,
      type: 'existingTitleName',
      statusText: 'Já existe um item com esse nome. Escolha outro.',
    };
  }

  if (direct && infoUserLogged) {
    const replaced = await verifyReplacement({
      lessonId: idLesson, imageKey, audioKey,
      imageName: formData.get('imageName')?.toString(), audioName: formData.get('audioName')?.toString(),
    });
    if (!replaced.ok) return { status: 555, statusText: `⛔ ${replaced.message}` };

    const asFile = (m: NonNullable<typeof replaced.image>) => ({ size: String(m.size), type: m.type, name: m.name, lastModified: String(Date.now()), path: m.url });
    const updated = await updateLessonInOurBase(
      infoUserLogged.id, idLesson, description, Title,
      replaced.image ? asFile(replaced.image) : undefined,
      replaced.audio ? asFile(replaced.audio) : undefined,
      replaced.image?.url, replaced.audio?.url,
    );
    if (updated === null) return { status: 555, statusText: '⛔ Não foi possível concluir a ação' };

    // Só agora (banco atualizado) apaga os objetos antigos; falha aqui não desfaz a edição (a limpeza noturna recolhe).
    const old = new ObjectStorageAdapter('lessons');
    const nameOf = (u: string | undefined) => (u ? u.split('?')[0].split('/').pop() : undefined);
    if (replaced.image) await old.deleteBlobIfExists(nameOf(leson.photoLeson) ?? '').catch(() => undefined);
    if (replaced.audio) await old.deleteBlobIfExists(nameOf(leson.audiofile) ?? '').catch(() => undefined);
    await recomputeSizeBytes(idLesson).catch(() => undefined);
    return { status: 200, statusText: '✅ Ação concluída com sucesso' };
  }

  const azureBlob = new ObjectStorageAdapter('lessons');

  const lessonId = uuidv4();

  let imageUrl = leson.photoLeson;
  let audioUrl = leson.audiofile;

  // Define objects for update
  let photoObject;
  let audioObject;

  // Process image only if it's a new file
  if (isPhotoFile) {
    const blobImageName: string = leson.photoLeson.split('?')[0].split('/').pop() as string;

    await azureBlob.deleteBlobIfExists(blobImageName);

    const imageFileName = `lesson_${lessonId}.jpeg`;

    const imageBuffer = Buffer.from(await photo.arrayBuffer());

    const imageUrlSas = await azureBlob.uploadFile(imageBuffer, imageFileName);

    imageUrl = imageUrlSas;

    photoObject = {
      size: String(photo.size),
      type: photo.type,
      name: photo.name,
      lastModified: String(photo.lastModified),
      path: JSON.stringify(imageUrlSas),
    };
  }

  // Process audio only if it's a new file
  if (isAudioFile) {
    const blobNameAudio: string = leson.audiofile.split('?')[0].split('/').pop() as string;

    await azureBlob.deleteBlobIfExists(blobNameAudio);

    const audioFileName = `audio_${lessonId}.mp3`;

    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    const audioUrlSas = await azureBlob.uploadFile(audioBuffer, audioFileName);

    audioUrl = audioUrlSas;

    audioObject = {
      size: String(audio.size),
      type: audio.type,
      name: audio.name,
      lastModified: String(audio.lastModified),
      path: JSON.stringify(audioUrlSas),
    };
  }

  const updatedLesson = await updateLessonInOurBase(
    infoUserLogged.id,
    idLesson,
    description,
    Title,
    isPhotoFile ? photoObject : undefined,
    isAudioFile ? audioObject : undefined,
    isPhotoFile ? imageUrl : undefined,
    isAudioFile ? audioUrl : undefined,
  );

  if (updatedLesson !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  } else {
    return {
      status: 555,
      statusText: '⛔ Não foi possível concluir a ação',
    };
  }
}
