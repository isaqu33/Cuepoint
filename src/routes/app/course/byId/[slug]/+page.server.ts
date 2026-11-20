import { Actions } from '@sveltejs/kit';
import { getAllDataServer } from './_actions/get-data-by-id.server';
import { getMoreDataFromCourseById } from './_actions/get-more-data.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = getAllDataServer;

export const actions: Actions = {
  getMoreDataFromCourseById,
};
