import type { Actions, PageServerLoad } from './$types';
import { deleteAction } from './_actions/delete.server';
import { getAllDatalessonServer } from './_actions/get-all-data.server';
import { publishAction } from './_actions/publish.server';
import { trascriptFile } from './_actions/transcript-file.server';
import { unPublishAction } from './_actions/unpublish.server';

export const load: PageServerLoad = getAllDatalessonServer;

export const actions: Actions = {
  trascriptFile,
  publishAction,
  unPublishAction,
  deleteAction,
};
