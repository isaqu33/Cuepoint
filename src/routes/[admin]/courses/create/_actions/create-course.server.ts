import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { createCourse } from '../../../../../server/services/course/create-course';
import { ObjectStorageAdapter } from '../../../../../utils/object-storage';
import { v4 as uuidv4 } from 'uuid';
import { getCoursetoEditByTitle } from '../../../../../server/services/course/verify-title-exits';

export async function createCourseServer(
  { locals, request }: RequestEvent,
  deps = { z },
): Promise<object> {
  const infoUserLogged = await locals.user;

  const formData = await request.formData();

  const About = (await formData?.get('About')?.toString()) ?? '';
  const Title = (await formData?.get('Title')?.toString()) ?? '';
  const selectedSeries = (await formData?.get('selectedSeries')?.toString()) ?? '';
  const photo = (await formData.get('image')) as File;

  const VerifyTitleExits = await getCoursetoEditByTitle(Title);

  if (VerifyTitleExits !== null) {
    return {
      status: 555,
      type: 'titleExists',
      statusText: 'Já existe um item com esse título. Escolha outro.',
    };
  }

  const azureBlob = new ObjectStorageAdapter('courses');

  const lessonId = uuidv4();

  // ------------------ Upload da Imagem ------------------
  const imageFileName = `course_${lessonId}.jpeg`;

  const imageBuffer = Buffer.from(await photo.arrayBuffer());

  const imageUrl = await azureBlob.uploadFile(imageBuffer, imageFileName);

  const createdCourse = await createCourse(
    infoUserLogged.id as string,
    Title,
    About,
    selectedSeries.split(','),
    imageUrl,
    {
      size: photo.size as unknown as string,
      type: photo.type as string,
      name: photo.name as string,
      lastModified: photo.lastModified as unknown as string,
      path: photo ? imageUrl : '',
    },
  );

  if (createdCourse !== null) {
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
