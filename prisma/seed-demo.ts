/** Dados fictícios para ver o produto funcionando. Uso: npm run db:seed:demo */
import { PrismaClient } from '@prisma/client';
import { enqueueTranscription } from '../src/server/transcription/queue';
import { state } from '../src/server/transcription/state';

const prisma = new PrismaClient();
const art = (a: string, b: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><g fill="#fff" fill-opacity=".55"><rect x="90" y="170" width="20" height="60" rx="10"/><rect x="130" y="140" width="20" height="120" rx="10"/><rect x="170" y="160" width="20" height="80" rx="10"/><rect x="250" y="150" width="20" height="100" rx="10"/><rect x="290" y="180" width="20" height="40" rx="10"/></g><rect x="206" y="100" width="8" height="200" rx="4" fill="#FBBF24"/></svg>`,
  );

const admin = await prisma.user.findFirstOrThrow({ where: { isAdmin: true } });

const course =
  (await prisma.collection.findUnique({ where: { title: 'Treinamento de equipe' } })) ??
  (await prisma.collection.create({
    data: { title: 'Treinamento de equipe', about: 'Curso de demonstração', photoLeson: art('#4F46E5', '#1E1B4B'), createdByUserId: admin.id },
  }));
const serie =
  (await prisma.subcollection.findUnique({ where: { title: 'Discursos históricos' } })) ??
  (await prisma.subcollection.create({
    data: { title: 'Discursos históricos', about: 'Série de demonstração', photoLeson: art('#0E7490', '#164E63'), courses: { connect: { id: course.id } }, createdByUserId: admin.id },
  }));
const lesson =
  (await prisma.mediaFile.findUnique({ where: { title: 'Discurso de posse (amostra)' } })) ??
  (await prisma.mediaFile.create({
    data: {
      title: 'Discurso de posse (amostra)',
      description: 'Áudio de exemplo para demonstrar o fluxo: envio, fila, transcrição com tempo e revisão.',
      photoLeson: art('#F59E0B', '#B45309'),
      audiofile: 'https://github.com/ggml-org/whisper.cpp/raw/master/samples/jfk.wav',
      userid: admin.id,
      createdByUserId: admin.id,
      courses: { connect: { id: course.id } },
      series: { connect: { id: serie.id } },
    },
  }));
await prisma.subcollection.update({ where: { id: serie.id }, data: { lessons: { connect: { id: lesson.id } } } });

const { enqueued } = await enqueueTranscription({ lessonId: lesson.id, userId: admin.id });
if (enqueued) await state.queued(lesson.id);
console.log(`Demo pronta. Aula: ${lesson.id} (transcrição ${enqueued ? 'enfileirada' : 'já existente'})`);
await prisma.$disconnect();
process.exit(0);
