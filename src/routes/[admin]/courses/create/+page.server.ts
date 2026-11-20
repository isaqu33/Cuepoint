import type { Actions, PageServerLoad } from './$types';

import { createCourseServer } from './_actions/create-course.server';
import { getAllDataCourseFormServer } from './_actions/get-all-data.serve';

export const load: PageServerLoad = getAllDataCourseFormServer;

export const actions: Actions = {
  createCourseServer,
};
