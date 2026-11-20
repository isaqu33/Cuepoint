import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getCourseEdit } from '../../../../../../server/services/course/get-course-to-edit';
import { v4 as uuidv4 } from 'uuid';
import { updateCourseInOurBase } from '../../../../../../server/services/course/update-course';
import type { CourseType } from '../../../types';
import { getCourseByName } from '../../../../../../server/services/course/admin/get-by-name';
import { ObjectStorageAdapter } from '../../../../../../utils/object-storage';

interface CourseWithRelations extends CourseType {
  series: { id: string; title: string }[];
  photoLeson: string;
}

export async function updateCourseServer(
  { locals, request }: RequestEvent,
  deps = { z },
): Promise<object> {
  const infoUserLogged = await locals.user;

  const formData = await request.formData();
  const idCourse = formData?.get('id')?.toString() ?? '';
  const About = (await formData?.get('About')?.toString()) ?? '';
  const Title = (await formData?.get('Title')?.toString()) ?? '';
  const selectedSeries = (await formData?.get('selectedSeries')?.toString()) ?? '';
  const photo = (await formData.get('image')) as File | any;

  const isPhotoFile = typeof photo !== 'string' && photo instanceof File;

  const course = (await getCourseEdit(idCourse)) as unknown as CourseWithRelations;
  const existingTitleInDataBase = await getCourseByName(Title);

  const actualseriesfromdatabase = course?.series.map((item) => item.title);

  const titleChanged = course?.title !== Title;
  const aboutChanged = course?.about !== About;
  const seriesChanged = actualseriesfromdatabase?.join(',') !== selectedSeries;

  if (!titleChanged && !aboutChanged && !seriesChanged && !isPhotoFile) {
    return {
      status: 555,
      type: 'generalError',
      statusText: '✅ Ação concluída com sucesso',
      noChanges: true,
    };
  }

  if (titleChanged && existingTitleInDataBase && existingTitleInDataBase.id !== idCourse) {
    return {
      status: 555,
      type: 'existingTitleName',
      statusText: 'Já existe um item com esse nome. Escolha outro.',
    };
  }

  const azureBlob = new ObjectStorageAdapter('courses');

  const lessonId = uuidv4();

  let imageUrl = course.photoLeson || '';

  let fileObject: any;

  if (isPhotoFile) {
    const blobImageName: string = course.photoLeson.split('?')[0].split('/').pop() as string;

    await azureBlob.deleteBlobIfExists(blobImageName);

    const imageFileName = `course_${lessonId}.jpeg`;

    const imageBuffer = Buffer.from(await photo.arrayBuffer());

    const imageUrlSas = await azureBlob.uploadFile(imageBuffer, imageFileName);

    imageUrl = imageUrlSas;

    fileObject = {
      size: String(photo.size),
      type: photo.type,
      name: photo.name,
      lastModified: String(photo.lastModified),
      path: JSON.stringify(imageUrlSas),
    };
  }

  const updatedCourse = await updateCourseInOurBase(
    idCourse,
    Title,
    About,
    selectedSeries,
    infoUserLogged.id,
    isPhotoFile ? imageUrl : undefined,
    isPhotoFile ? fileObject : undefined,
  );

  if (updatedCourse !== null) {
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
