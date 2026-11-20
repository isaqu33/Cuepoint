import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';

import { getAllSeries } from '../../../server/services/serie/get-all-series';

export async function getMoreSeriesPagination(
  { request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const paginationSerie = (await formData?.get('paginationSerie')?.toString()) ?? '';

  const promises = [getAllSeries(Number(paginationSerie))];

  const [series] = await Promise.all(promises);

  return {
    targetEntity: 'series',
    series: series,
  };
}
