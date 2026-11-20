import type { Actions, PageServerLoad } from './$types.ts';

import { getLessonByIdServer } from './_actions/get-data-by-id.server';
import { updateLessonServer } from './_actions/update-lesson.server.js';

export const load: PageServerLoad = getLessonByIdServer;

export const actions: Actions = {
  updateLessonServer,
};
