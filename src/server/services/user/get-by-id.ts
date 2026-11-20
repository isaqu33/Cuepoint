import { prisma } from '../../utils/db';

interface Props {
  id: string;
}
export async function getById({ id }: Props) {
  const result = await prisma.user.findFirst({
    where: {
      id,
    },
  });
  return result;
}
