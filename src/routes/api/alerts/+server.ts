import { json } from '@sveltejs/kit';
import { evaluateAlerts } from '../../../server/observability/alerts';
import { collectSignals } from '../../../server/observability/alerts-runner';
import type { RequestHandler } from './$types';

/** Alertas ativos agora, com a ação recomendada de cada um. Só o operador de plataforma (hooks). */
export const GET: RequestHandler = async () => {
  const signals = await collectSignals();
  return json({ alerts: evaluateAlerts(signals), signals }, { headers: { 'Cache-Control': 'no-store' } });
};
