import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { getSerietoEdit } from '../../../../server/services/serie/get-serie-to-edit';
import { deleteFile } from '../../../../server/services/file/delete-file';
import { deletSerieInOurBase } from '../../../../server/services/serie/delete-serie';
import type { SerieType } from '../types';
import { ObjectStorageAdapter } from '../../../../utils/object-storage';

export async function deleteAction(
  { request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const id = formData?.get('id')?.toString() ?? '';

  const serie: SerieType = (await getSerietoEdit(id)) as unknown as SerieType;

  const azureBlob = new ObjectStorageAdapter('series');

  const blobNamePhoto: string = serie.photoLeson.split('?')[0].split('/').pop() as string;

  await azureBlob.deleteBlobIfExists(blobNamePhoto);

  if (serie.files && serie.files.length > 0) {
    for (const item of serie.files) {
      await deleteFile(item.id);
    }
  }

  const deletedSerie = await deletSerieInOurBase(id);

  if (deletedSerie !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  } else {
    return {
      status: 555,
      statusText: '⛔ Não foi possível concluir a ação',
    };
  }
}
