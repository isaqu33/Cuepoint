import type { Actions, PageServerLoad } from './$types';
import { getAllDataServer } from './_actions/get-all-data.server';
import { deleteAction } from './_actions/delete.server';
import { unPublishAction } from './_actions/unpublish.server';
import { publishAction } from './_actions/publish.server';

export const load: PageServerLoad = getAllDataServer;

export const actions: Actions = {
  deleteAction,
  publishAction,
  unPublishAction,
};
