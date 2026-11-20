import { Actions } from '@sveltejs/kit';

import { forgotPassword } from './forgot-password.server';

export const actions: Actions = {
  forgotPassword,
};
