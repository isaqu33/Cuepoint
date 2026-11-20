import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { transcriptionConfig } from './config';
import type { TranscriptionJob } from './contracts';
import { convertToWav, downloadToFile, run } from './media';
import { buildEvent } from '../events/contracts';
import { emit, publishEvent } from '../events/publish';
import { state } from './state';
import { parseCueLine, parseProgress, plainTextToHtml } from './text';
import { clearCues, pushCue } from './cues';
import { prisma } from '../utils/db';


/**
 * Pipeline completo de uma transcrição. Só retorna (e portanto só deixa o
 * consumidor da fila sinalizar conclusão) depois que o resultado foi gravado.
 * Qualquer erro propaga: a fila decide entre retry com backoff e falha terminal.
 */
export async function processTranscription(job: TranscriptionJob, opts: { attempt?: number } = {}): Promise<void> {
  const startedAt = Date.now();
  const cfg = transcriptionConfig();
  const { lessonId, userId } = job;

  const lesson = await prisma.mediaFile.findUnique({
    where: { id: lessonId },
    select: { id: true, title: true, audiofile: true, workspaceId: true },
  });
  if (!lesson?.audiofile) throw new Error('Aula sem arquivo de áudio.');

  await state.processing(lessonId);
  await emit('media.transcription.started', lessonId, { lessonId, userId, attempt: opts.attempt ?? 1 });

  // Diretório próprio por execução; sempre removido no finally.
  const dir = path.join(cfg.workDir, `${lessonId}-${Date.now()}`);
  await mkdir(dir, { recursive: true });

  try {
    const source = path.join(dir, 'source');
    const wav = path.join(dir, 'audio.wav');
    const outBase = path.join(dir, 'result');

    await downloadToFile(lesson.audiofile, source, cfg.maxDownloadBytes);
    await convertToWav(cfg.ffmpegBin, source, wav);
    await rm(source, { force: true }); // libera disco antes da etapa mais longa

    let lastPercent = -1;
    let cueIndex = 0;
    await clearCues(lessonId); // tentativa nova começa sem trechos da anterior
    const args = ['-m', cfg.whisperModel, '-f', wav, '-otxt', '-ovtt', '-of', outBase, '-pp'];
    if (cfg.whisperLanguage) args.push('-l', cfg.whisperLanguage);
    if (cfg.whisperThreads) args.push('-t', String(cfg.whisperThreads));

    await run(cfg.whisperBin, args, {
      // Trechos entregues conforme ficam prontos (streaming): efêmeros no tópico + buffer curto para retomada.
      onStdoutLine(line) {
        const cue = parseCueLine(line);
        if (!cue) return;
        const data = { lessonId, index: cueIndex++, ...cue };
        void pushCue(lessonId, data).catch(() => undefined);
        void publishEvent(buildEvent('media.transcription.cue', lessonId, data));
      },
      onStderrLine(line) {
        const percent = parseProgress(line);
        if (percent === null || percent === lastPercent) return;
        lastPercent = percent;
        void publishEvent(buildEvent('media.transcription.progress', lessonId, { lessonId, percent }));
        // Persiste a cada 5% para sobreviver a reconexões sem martelar o banco.
        if (percent % 5 === 0) void state.progress(lessonId, percent).catch(() => undefined);
      },
    });

    const [txt, vtt] = await Promise.all([
      readFile(`${outBase}.txt`, 'utf-8'),
      readFile(`${outBase}.vtt`, 'utf-8'),
    ]);
    if (!txt.trim()) throw new Error('A transcrição gerada está vazia.');

    const completed = buildEvent('media.transcription.completed', lessonId, {
      lessonId,
      userId,
      durationMs: Date.now() - startedAt,
      language: cfg.whisperLanguage,
    });
    await state.ready(lessonId, userId, { html: plainTextToHtml(txt), vtt, language: cfg.whisperLanguage }, completed, lesson.workspaceId);
    await publishEvent(completed); // e-mail, métricas e tela reagem; este código não os conhece
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

}
