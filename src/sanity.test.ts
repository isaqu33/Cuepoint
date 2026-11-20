import { prisma } from './server/utils/db';
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('o vitest está funcionando', () => {
    expect(1 + 2).toBe(3);
  });

  // Conectividade, não conteúdo: não depende de dados de seed. Roda onde há banco (container web / CI).
  it('conecta ao banco de dados', async () => {
    const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    expect(Number(rows[0].ok)).toBe(1);
  });
});
