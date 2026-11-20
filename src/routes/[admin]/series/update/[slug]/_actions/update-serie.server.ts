import { RequestEvent } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import { getSerietoEdit } from '../../../../../../server/services/serie/get-serie-to-edit.js';
import { editSerie } from '../../../../../../server/services/serie/edit-serie';
import { getSerieByTitle } from '../../../../../../server/services/serie/get-serie-by-title.js';
import { ObjectStorageAdapter } from '../../../../../../utils/object-storage';

interface SerieWithRelations {
  id: string;
  title: string;
  about: string;
  photoLeson?: string | null; // Marked as optional and can be null
  lessons: { id: string; title: string }[];
  series: { id: string; title: string }[];
}

function extractAndValidateFormData(formData: FormData):
  | {
      id: string;
      title: string;
      about: string;
      lessons: string[];
      series: string[];
      image: FormDataEntryValue | null;
    }
  | { error: { status: number; statusText: string } } {
  const id = formData.get('id')?.toString();
  const title = formData.get('Title')?.toString()?.trim();
  const about = formData.get('About')?.toString();
  const lessons = formData.get('selectedLessons')?.toString()?.split(',').filter(Boolean) || [];
  const series = formData.get('selectedSeries')?.toString()?.split(',').filter(Boolean) || [];
  const image = formData.get('image');

  if (!title || !about || !lessons.length) {
    const missingFields = [!title && 'Title', !about && 'About', !lessons.length && 'Lessons']
      .filter(Boolean)
      .join(', ');

    return {
      error: {
        status: 400,
        statusText: `Missing fields: ${missingFields}`,
      },
    };
  }

  return { id: id!, title, about, lessons, series, image };
}

export async function updateSerieServer({ request, locals }: RequestEvent): Promise<object> {
  const infoUserLogged = await locals.user;

  const formData = await request.formData();

  // Extract form data safely
  const extractedData = extractAndValidateFormData(formData);

  if ('error' in extractedData) {
    return extractedData.error;
  }

  const { id, title, about, lessons, image } = extractedData;

  const currentSerie = (await getSerietoEdit(id)) as unknown as SerieWithRelations;
  const existingTitleInDataBase = await getSerieByTitle(title);

  // Determine if the image is a valid file
  const isImageFile = image instanceof File;

  const currentLessonsStr = currentSerie.lessons?.map((l) => l.title || '').join(',') || '';

  const hasChanges =
    title !== currentSerie.title ||
    about !== currentSerie.about ||
    lessons.join(',') !== currentLessonsStr ||
    isImageFile;
  if (!hasChanges) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
      hasChanges: false,
    };
  }

  if (existingTitleInDataBase && currentSerie?.title !== title) {
    return {
      status: 500,
      type: 'existingTitleName',
      statusText: 'Já existe um item com esse nome. Escolha outro.',
    };
  }

  const azureBlob = new ObjectStorageAdapter('series');

  const lessonId = uuidv4();

  let imageUrl = currentSerie.photoLeson || '';

  let photoObject;

  // Process image only if a new one was sent
  if (isImageFile) {
    const blobImageName: string = currentSerie?.photoLeson
      ?.split('?')[0]
      .split('/')
      .pop() as string;

    await azureBlob.deleteBlobIfExists(blobImageName);

    const imageFileName = `serie_${lessonId}.jpeg`;

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    const imageUrlSas = await azureBlob.uploadFile(imageBuffer, imageFileName);

    imageUrl = imageUrlSas;

    photoObject = {
      size: String(image.size),
      type: image.type,
      name: image.name,
      lastModified: String(image.lastModified),
      path: JSON.stringify(imageUrlSas),
    };
  }

  const updatedSerie = await editSerie(
    infoUserLogged.id,
    lessons.join(','),
    title,
    about,
    id,
    isImageFile ? imageUrl : undefined,
    isImageFile ? photoObject : undefined,
  );

  if (updatedSerie !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
      hasChanges: true,
    };
  } else {
    return {
      status: 555,
      statusText: '⛔ Não foi possível concluir a ação',
    };
  }
}
