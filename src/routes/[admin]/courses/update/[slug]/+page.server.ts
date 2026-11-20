import type { Actions, PageServerLoad } from './$types';

import { getAllInfosByIdServer } from './_actions/get-data-by-id.server';
import { updateCourseServer } from './_actions/update-course.server';

export const load: PageServerLoad = getAllInfosByIdServer;

export const actions: Actions = {
  updateCourseServer,
};
