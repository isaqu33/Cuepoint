import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { getSerietoEdit } from '../../../../server/services/serie/get-serie-to-edit';
import type { SerieType } from '../types';
import { publishSerie } from '../../../../server/services/serie/publish';

export async function publishAction(
  { request, cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const id = formData?.get('id')?.toString() ?? '';

  const series: SerieType = (await getSerietoEdit(id)) as unknown as SerieType;

  if (series.isPublished == true) {
    return {
      status: 400,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  const isDone = await publishSerie(id);

  if (isDone !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  return {
    status: 400,
    statusText: '⛔ Não foi possível concluir a ação',
  };
}
