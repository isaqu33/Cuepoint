import { updateSerieServer } from './_actions/update-serie.server';
import { getByIdSerieServer } from './_actions/get-data-by-id.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = getByIdSerieServer;

export const actions: Actions = {
  updateSerieServer,
};
