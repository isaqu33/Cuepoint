import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { deleteSessionTokenCookie } from '$lib/server/auth';

export async function logoutUserServer(
  event: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
) {
  await deleteSessionTokenCookie(event);

  return {
    status: 200,
    statusText: 'sucess',
  };
}
