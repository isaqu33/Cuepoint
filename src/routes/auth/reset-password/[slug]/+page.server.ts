import type { PageServerLoad } from './$types.ts';
import { verifyToken } from './_actions/get-data.server';
import { resetPassword } from './_actions/reset-password.server.js';

export const load: PageServerLoad = verifyToken;

export const actions = {
  resetPassword,
};
