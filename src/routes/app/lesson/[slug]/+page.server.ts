import { getAllDataServer } from './_actions/get-data-by-id.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = getAllDataServer;
