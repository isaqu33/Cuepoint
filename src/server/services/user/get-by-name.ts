import { prisma } from '../../utils/db';

interface Props {
  name: string;
}

export async function getByName({ name }: Props) {
  const result = await prisma.user.findFirst({
    where: {
      name,
    },
  });
  return result;
}
