import type { LayoutServerLoad } from './$types';
import { getAllDataServer } from './get-all-data.server';

export const load: LayoutServerLoad = getAllDataServer;
