import { getAllDataByIdUserServer } from './get-data.server';
import type { PageServerLoad } from './$types.ts';

export const load: PageServerLoad = getAllDataByIdUserServer;
