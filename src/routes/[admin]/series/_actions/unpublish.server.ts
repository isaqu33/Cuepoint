import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import type { SerieType } from '../types';
import { getSerietoEdit } from '../../../../server/services/serie/get-serie-to-edit';
import { unPublishSerie } from '../../../../server/services/serie/unpublished';

export async function unPublishAction(
  { request, cookies }: RequestEvent,
  // eslint-disabn
  // -next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const id = formData?.get('id')?.toString() ?? '';

  const serie: SerieType = (await getSerietoEdit(id)) as unknown as SerieType;

  if (serie.isPublished == false) {
    return {
      status: 400,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  const isDone = await unPublishSerie(id);

  if (isDone !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  return {
    status: 400,
    statusText: '⛔ Senha incorreta',
  };
}
