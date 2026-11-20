import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getAllSeriesPaginationAdmin } from '../../../../server/services/serie/admin/get-all-series-pagination';
import { getItensNumber } from '../../../../server/services/serie/admin/get-number-items';

export async function getAllDataSerieServer(
  { cookies, locals, url }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const page = url.searchParams.get('page') || '0';

  const result = await getAllSeriesPaginationAdmin(Number(page));

  const totalNumbersItensSerie = await getItensNumber();

  if (result! !== null) {
    return {
      data: result,

      totalNumbersItens: totalNumbersItensSerie,
      language: cookies.get('language'),
      page,
      totalNumbersPagination: totalNumbersItensSerie,
    };
  } else {
    return {
      error: "Chave não identificada",
    };
  }
}
