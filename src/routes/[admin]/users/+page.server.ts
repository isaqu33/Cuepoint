import type { Actions, PageServerLoad } from './$types';
import { logoutUserServer } from './_actions/logout.server';
import { allUsers } from './_actions/get-all-data.server';
import { lockUnlockUserAction } from './_actions/lock-unlock.server';
import { sendEmailUserWelcome } from './_actions/send-email-welcome.server';
import { sendEmailUserChangePassword } from './_actions/send-email-change-password.server';

export const load: PageServerLoad = allUsers;

export const actions: Actions = {
  logoutUserServer,
  lockUnlockUserAction,
  sendEmailUserWelcome,
  sendEmailUserChangePassword,
};
