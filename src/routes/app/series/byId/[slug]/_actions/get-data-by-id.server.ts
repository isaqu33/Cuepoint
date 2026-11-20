import { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { Lesson } from '../types';
import { getSerieByLimite } from '../../../../../../server/services/serie/app/get-data-by-limit';

export async function getAllDataServer(
  { params, cookies, url }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { redirect },
): Promise<object> {
  const serie: Lesson = (await getSerieByLimite(params.slug as string)) as unknown as Lesson;

  if (!serie) {
    throw deps.redirect(303, '/app');
  }

  return {
    data: serie,
    book: url.searchParams.get('book'),
    idbook: url.searchParams.get('idbook'),
    language: cookies.get('language'),
  };
}
