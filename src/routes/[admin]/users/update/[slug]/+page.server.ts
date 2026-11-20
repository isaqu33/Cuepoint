import type { Actions } from './$types';
import type { PageServerLoad } from './$types.ts';

import { getByIdUser } from './_actions/get-data-by-Id.server';
import { updateUserServer } from './_actions/update-user.server';

export const load: PageServerLoad = getByIdUser;

export const actions: Actions = {
  updateUserServer,
};
