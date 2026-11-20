import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getAlllessonsForm } from '../../../../../../server/services/lesson/admin/get-all-lessons-form';
import { getSerietoEditAdmin } from '../../../../../../server/services/serie/admin/get-serie-to-edit';

export async function getByIdSerieServer({ params }: RequestEvent, deps = { z }): Promise<object> {
  const serie = await getSerietoEditAdmin(params.slug as string);
  const Alllessons = await getAlllessonsForm();

  return {
    lessons: Alllessons,
    data: serie,
    userid: params.slug,
  };
}
