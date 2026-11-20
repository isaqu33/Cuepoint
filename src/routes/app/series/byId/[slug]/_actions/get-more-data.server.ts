import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import type { Lesson } from '../types';
import { getSerieByLimite } from '../../../../../../server/services/serie/app/get-data-by-limit';

export async function getMoreDataFromSerieById(
  { request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const idSerie = (await formData?.get('id')?.toString()) ?? '';
  const paginationSerie = (await formData?.get('paginationSerie')?.toString()) ?? '';

  const leson: Lesson = (await getSerieByLimite(
    idSerie,
    Number(paginationSerie),
  )) as unknown as Lesson;

  return {
    data: leson,
  };
}
