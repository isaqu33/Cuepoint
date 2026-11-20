import { fail, type Cookies } from '@sveltejs/kit';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

type getByIdUserServerProps = {
  params: {
    slug: string;
  };
  cookies: Cookies;
  locals: App.Locals;
  request: Request;
};
export async function verifyToken(
  args: getByIdUserServerProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z, fail },
): Promise<object> {
  const decodedToken = jwt.verify(args.params.slug, process.env.APP_JWT_SECRET_KEY as string) as {
    userId: string;
  };

  if (decodedToken !== null && decodedToken.userId) {
    return {
      status: 200,
      iduser: decodedToken.userId,
    };
  } else {
    throw new Error('Invalid or missing token');
  }
}
