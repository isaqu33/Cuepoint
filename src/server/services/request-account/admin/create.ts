import { prisma } from '../../../utils/db';

interface createAccountRequestProp {
  name: string;
  email: string;
  request: string;
}

export async function createAccountRequest(data: createAccountRequestProp) {
  await prisma.accountRequest.create({
    data,
  });
}
