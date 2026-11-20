// import { beforeEach, expect } from 'vitest';
// import { PrismaClient } from '@prisma/client';

// beforeEach(async () => {
//   const prisma = new PrismaClient();
//   const models = Reflect.ownKeys(prisma).filter((key) => typeof prisma[key] === 'object');
//   for (const model of models) {
//     if (prisma[model] && prisma[model].deleteMany) {
//       await prisma[model].deleteMany();
//       const count = await prisma[model].count();
//       expect(count).toBe(0);
//     }
//   }
// });
