/**
 * Processo de assinantes de eventos: e-mail e métricas.
 * Roda separado do worker de mídia — se cair, a transcrição continua funcionando
 * (quem publica não conhece quem assina).
 */
import { getBus } from '../src/server/events/publish';
import { startEmailSubscriber } from '../src/server/events/subscribers/email';
import { startMetricsSubscriber } from '../src/server/events/subscribers/metrics';
import { prisma } from '../src/server/utils/db';

const bus = getBus();
const stops = await Promise.all([startEmailSubscriber(bus), startMetricsSubscriber(bus)]);
console.log('[events] assinantes ativos: email, metrics');

async function shutdown(signal: string) {
  console.log(`[events] ${signal} recebido; encerrando…`);
  await Promise.all(stops.map((stop) => stop()));
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
