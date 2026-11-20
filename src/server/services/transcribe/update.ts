import { prisma } from '../../utils/db';

interface props {
  id: string;
  html: string;
}

export async function updateTrnascribe(info: props) {
  return await prisma.transcription.update({
    where: {
      id: info.id,
    },
    data: {
      transcription: info.html,
    },
  });
}
