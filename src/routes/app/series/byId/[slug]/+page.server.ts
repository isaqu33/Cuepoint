import { Actions } from '@sveltejs/kit';
import { getAllDataServer } from './_actions/get-data-by-id.server';
import { getMoreDataFromSerieById } from './_actions/get-more-data.server';
import type { PageServerLoad } from './$types.ts';

export const load: PageServerLoad = getAllDataServer;

export const actions: Actions = {
  getMoreDataFromSerieById,
};
