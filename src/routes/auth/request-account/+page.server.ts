import type { Actions } from './$types';

import { requestAccount } from './_actions/request-account.server';

export const actions: Actions = {
  requestAccount,
};
