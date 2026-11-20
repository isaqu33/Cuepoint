import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/**
 * As URLs gravadas no banco são as públicas (navegador). Dentro da rede Docker o worker
 * precisa falar com o storage pelo endereço interno.
 */
export function toInternalStorageUrl(raw: string): string {
  const pub = process.env.MINIO_PUBLIC_URL?.replace(/\/$/, '');
  const host = process.env.MINIO_ENDPOINT;
  if (!pub || !host) return raw;
  const proto = process.env.MINIO_USE_SSL?.toLowerCase() === 'true' ? 'https' : 'http';
  const internal = `${proto}://${host}${process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : ''}`;
  const clean = raw.replace(/"/g, '');
  return clean.startsWith(pub) ? internal + clean.slice(pub.length) : clean;
}

/** Aceita apenas http(s); o endereço vem do banco, nunca do cliente. */
export function assertHttpUrl(raw: string): URL {
  const url = new URL(raw.replace(/"/g, ''));
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Protocolo não permitido: ${url.protocol}`);
  }
  return url;
}

/**
 * Baixa o áudio direto para o disco, em streaming (memória constante),
 * abortando se passar do limite de tamanho.
 */
export async function downloadToFile(
  url: string,
  dest: string,
  maxBytes: number,
): Promise<number> {
  const res = await fetch(assertHttpUrl(toInternalStorageUrl(url)));
  if (!res.ok || !res.body) {
    throw new Error(`Download falhou: HTTP ${res.status}`);
  }
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared && declared > maxBytes) {
    throw new Error(`Arquivo excede o limite (${declared} > ${maxBytes} bytes)`);
  }

  let received = 0;
  const limiter = new Transform({
    transform(chunk, _enc, cb) {
      received += chunk.length;
      if (received > maxBytes) cb(new Error('Arquivo excede o limite de tamanho'));
      else cb(null, chunk);
    },
  });

  await pipeline(Readable.fromWeb(res.body as never), limiter, createWriteStream(dest));
  return received;
}

export interface RunOptions {
  onStderrLine?: (line: string) => void;
  /** Linhas do stdout (ex.: segmentos do whisper-cli conforme ficam prontos). */
  onStdoutLine?: (line: string) => void;
}

/** Executa um binário com argumentos em array (sem shell: sem injeção de comando). */
export function run(bin: string, args: string[], opts: RunOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', opts.onStdoutLine ? 'pipe' : 'ignore', 'pipe'] });
    let tail = '';
    let buffer = '';
    let outBuffer = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      outBuffer += chunk.toString();
      const lines = outBuffer.split(/\r?\n/);
      outBuffer = lines.pop() ?? '';
      for (const line of lines) opts.onStdoutLine?.(line);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      tail = (tail + text).slice(-2000);
      buffer += text;
      const lines = buffer.split(/[\r\n]+/);
      buffer = lines.pop() ?? '';
      for (const line of lines) opts.onStderrLine?.(line);
    });
    child.on('error', (err) => reject(new Error(`Falha ao iniciar ${bin}: ${err.message}`)));
    child.on('close', (code) => {
      if (buffer) opts.onStderrLine?.(buffer);
      if (outBuffer) opts.onStdoutLine?.(outBuffer);
      if (code === 0) resolve();
      else reject(new Error(`${bin} terminou com código ${code}: ${tail.trim().slice(-500)}`));
    });
  });
}

/** Converte para WAV 16 kHz mono PCM, formato esperado pelo whisper.cpp. */
export function convertToWav(ffmpegBin: string, input: string, output: string): Promise<void> {
  return run(ffmpegBin, [
    '-y', '-nostdin', '-loglevel', 'error',
    '-i', input,
    '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le',
    output,
  ]);
}
