import type { Actions, PageServerLoad } from './$types.ts';
import { getAllDataSerieServer } from './_actions/get-all-data.server.js';
import { deleteAction } from './_actions/delete.server';

import { publishAction } from './_actions/publish.server';
import { unPublishAction } from './_actions/unpublish.server';

export const load: PageServerLoad = getAllDataSerieServer;
export const actions: Actions = {
  deleteAction,
  publishAction,
  unPublishAction,
};
