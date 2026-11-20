import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { createSerie } from '../../../../../server/services/serie/create-serie.js';
import { verifySerieTitle } from '../../../../../server/services/serie/verify-titleseries-exist';
import { ObjectStorageAdapter } from '../../../../../utils/object-storage';

export async function createSerieServer(
  { request, locals }: RequestEvent,
  deps = { z },
): Promise<object> {
  const infoUserLogged = await locals.user;

  const formData = await request.formData();

  const About = (await formData?.get('About')?.toString()) ?? '';
  const Title = (await formData?.get('Title')?.toString()) ?? '';
  const selectedLessons = (await formData?.get('selectedLessons')?.toString()) ?? '';

  const photo = (await formData.get('image')) as File;

  const titleExists = await verifySerieTitle(Title.trim());

  if (titleExists) {
    return {
      status: 555,
      statusText: 'Já existe um item com esse título. Escolha outro.',
    };
  }

  const azureBlob = new ObjectStorageAdapter('series');

  const lessonId = uuidv4();

  // ------------------ Upload da Imagem ------------------
  const imageFileName = `serie_${lessonId}.jpeg`;

  const imageBuffer = Buffer.from(await photo.arrayBuffer());

  const imageUrl = await azureBlob.uploadFile(imageBuffer, imageFileName);

  const idsArray = selectedLessons.split(',');

  const createdSerie = await createSerie(
    infoUserLogged.id as string,
    idsArray,
    Title.trim(),
    About,
    [],
    [],
    [],
    imageUrl,
    {
      size: photo.size as unknown as string,
      type: photo.type as string,
      name: photo.name as string,
      lastModified: photo.lastModified as unknown as string,
      path: photo ? imageUrl : '',
    },
  );

  if (createdSerie !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  }
  return {
    status: 555,
    statusText: '⛔ Não foi possível concluir a ação',
  };
}
