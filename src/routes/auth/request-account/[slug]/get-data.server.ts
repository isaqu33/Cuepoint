import { fail, type Cookies } from '@sveltejs/kit';
import { z } from 'zod';

import { updateUserveriry } from '../../../../server/services/user/update-user-verifyed';

type getAllDataServerProps = {
  params: {
    slug: string;
  };
  cookies: Cookies;
  locals: App.Locals;
  request: Request;
};

export async function getAllDataByIdUserServer(
  args: getAllDataServerProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z, fail },
): Promise<object> {
  const updateuser = await updateUserveriry(args.params.slug);

  if (updateuser! !== null) {
    return { data: updateuser };
  } else {
    return {
      error: "Chave não identificada",
    };
  }
}
