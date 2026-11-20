import path from 'node:path';

/** Leitura lazy: o worker e o web só exigem a configuração quando usam. */
export function transcriptionConfig() {
  const env = process.env;
  return {
    redis: {
      host: env.APP_REDIS_HOST ?? 'localhost',
      port: Number(env.APP_REDIS_PORT ?? 6379),
    },
    realtimeUrl: env.REALTIME_URL ?? '',
    ffmpegBin: env.FFMPEG_BIN ?? 'ffmpeg',
    whisperBin: env.WHISPER_BIN ?? '/usr/local/bin/whisper-cli',
    whisperModel: env.WHISPER_MODEL_PATH ?? '/app/models/ggml-base.bin',
    whisperLanguage: env.WHISPER_LANGUAGE ?? 'auto',
    whisperThreads: Number(env.WHISPER_THREADS ?? 0) || undefined,
    workDir: path.resolve(env.TRANSCRIPTION_WORKDIR ?? '/app/uploads'),
    concurrency: Math.max(1, Number(env.TRANSCRIPTION_CONCURRENCY ?? 1)),
    attempts: Math.max(1, Number(env.TRANSCRIPTION_ATTEMPTS ?? 3)),
    /** Limite de tamanho do áudio baixado (bytes). Padrão: 1 GiB. */
    maxDownloadBytes: Number(env.TRANSCRIPTION_MAX_BYTES ?? 1024 ** 3),
  };
}
