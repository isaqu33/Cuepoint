import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getAlllessons } from '../../../../../server/services/lesson/get-all-lessons';
import { getAlllessonsForm } from '../../../../../server/services/lesson/admin/get-all-lessons-form';

export async function getAllDataSerieServer(
  { cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const Alllessons = await getAlllessonsForm();

  if (getAlllessons !== null) {
    return {
      lessons: Alllessons,
    };
  } else {
    return {
      error: "Chave não identificada",
    };
  }
}
