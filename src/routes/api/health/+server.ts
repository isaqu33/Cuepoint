import { json } from '@sveltejs/kit';
import { prisma } from '../../../server/utils/db';

/** Liveness + prontidão (banco). Usado pelo healthcheck do Docker. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({ status: 'ok' });
  } catch {
    return json({ status: 'degraded' }, { status: 503 });
  }
}
