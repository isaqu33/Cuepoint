import type { PageServerLoad } from './$types.ts';
import type { Actions } from './$types.ts';

import { getAllDataSerieServer } from './_actions/get-all-data.server.js';
import { createSerieServer } from './_actions/create-serie.server.js';

export const load: PageServerLoad = getAllDataSerieServer;

export const actions: Actions = {
  createSerieServer,
};
