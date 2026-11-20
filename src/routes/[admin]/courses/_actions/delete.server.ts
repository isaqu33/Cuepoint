import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getCourseEdit } from '../../../../server/services/course/get-course-to-edit';
import { deleteFile } from '../../../../server/services/file/delete-file';
import { deletCourseInOurBase } from '../../../../server/services/course/delete-course';
import { ObjectStorageAdapter } from '../../../../utils/object-storage';
import type { CourseType } from '../types';

export async function deleteAction(
  { request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();
  const id = formData?.get('id')?.toString() ?? '';

  const course: CourseType = (await getCourseEdit(id)) as unknown as CourseType;

  const azureBlob = new ObjectStorageAdapter('courses');

  const blobNamePhoto: string = course.photoLeson.split('?')[0].split('/').pop() as string;

  await azureBlob.deleteBlobIfExists(blobNamePhoto);

  if (course.files && course.files.length > 0) {
    for (const item of course.files) {
      await deleteFile(item.id);
    }
  }

  const deletedCourse = await deletCourseInOurBase(id);

  if (deletedCourse !== null) {
    return {
      status: 200,
      text: '✅ Ação concluída com sucesso',
    };
  } else {
    return {
      status: 555,
      text: '⛔ Não foi possível concluir a ação',
    };
  }
}
