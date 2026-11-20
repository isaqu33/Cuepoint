import type { Actions, PageServerLoad } from './$types';
import { createLessonServer } from './_actions/create-lesson.server';

export const actions: Actions = {
  createLessonServer,
};
