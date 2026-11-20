import type { LayoutServerLoad } from './$types.ts';
import { getAllDataToLayout } from './_actions/get-data-layout.server.js';

export const load: LayoutServerLoad = getAllDataToLayout;
