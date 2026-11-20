import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';

export async function getAllData(
  { cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  return {
    language: cookies.get('language'),
  };
}
