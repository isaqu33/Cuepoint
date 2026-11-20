import { getAllDataServer } from './_actions/get-all-data.server';
import type { Actions, PageServerLoad } from './$types';
import { deleteAccountRequest } from './_actions/delete.server';

export const load: PageServerLoad = getAllDataServer;

export const actions: Actions = {
  deleteAccountRequest,
};
