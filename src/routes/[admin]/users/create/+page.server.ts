import type { Actions } from './$types';
import { createUserServer } from './_actions/create-user.server';

export const actions: Actions = {
  createUserServer,
};
