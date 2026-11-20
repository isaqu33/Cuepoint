import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Redis from 'ioredis';

const PORT = Number(process.env.PORT || 3001);
const EVENTS_CHANNEL = 'cuepoint:events';
// Origens permitidas (separadas por vírgula). Em dev, "*" por padrão.
const ORIGINS = (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim());
const origin = ORIGINS.includes('*') ? '*' : ORIGINS;

const app = express();
const serverHttp = http.createServer(app);
const io = new Server(serverHttp, { cors: { origin } });

app.use(cors({ origin, methods: ['GET'] }));
app.get('/health', (_req, res) => res.json({ status: 'ok', redis: redis.status }));
app.get('/', (_req, res) => res.send('Cuepoint realtime'));

/**
 * Assinante do tópico de eventos de domínio: repassa aos navegadores.
 * Este serviço só LÊ eventos; quem quiser publicar usa o tópico, não o socket.
 *  - "evento":   todo evento (feed de atividade)
 *  - "progresso": formato legado {lessonId, porcentagem} para as telas existentes
 */
const redis = new Redis({
  host: process.env.APP_REDIS_HOST || 'localhost',
  port: Number(process.env.APP_REDIS_PORT || 6379),
});
redis.subscribe(EVENTS_CHANNEL).catch((err) => console.error('[realtime] falha ao assinar:', err.message));
redis.on('message', (_channel, raw) => {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return;
  }
  io.emit('evento', event);
  if (event.type === 'media.transcription.progress') {
    io.emit('progresso', { lessonId: event.data.lessonId, porcentagem: event.data.percent });
  }
});

serverHttp.listen(PORT, '0.0.0.0', () => console.log(`[realtime] porta ${PORT}`));

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    redis.disconnect();
    io.close(() => process.exit(0));
  });
}
