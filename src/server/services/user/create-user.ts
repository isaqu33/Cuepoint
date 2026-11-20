import { prisma } from '../../utils/db';
interface getUsertoEditProp {
  name: string;
  email: string;
  isAdmin: boolean;
}
export async function createUser({ name, email, isAdmin }: getUsertoEditProp) {
  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      username: name,
      isAdmin: isAdmin,
    },
  });

  return user;
}
