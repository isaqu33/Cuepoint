/** Cria (ou atualiza) o usuário administrador local a partir do .env. Uso: npm run db:seed:admin */
import { PrismaClient } from '@prisma/client';
import { registerNewPassword } from '../src/lib/server/password';

const prisma = new PrismaClient();
const email = process.env.APP_SYSTEM_USER_EMAIL;
const password = process.env.APP_SYSTEM_USER_PASSWORD;
if (!email || !password) throw new Error('Defina APP_SYSTEM_USER_EMAIL e APP_SYSTEM_USER_PASSWORD');

const user = await prisma.user.upsert({
  where: { email },
  create: {
    email,
    name: 'Admin',
    username: 'admin',
    isAdmin: true,
    isSystem: true,
    emailservice: { create: { isVerified: true, verifiedAt: new Date() } },
    boardinguser: { create: { isVerificationEmailSent: true, verificationEmailSentAt: new Date() } },
  },
  // A conta do .env é também o operador de plataforma (isSystem é único): gerencia espaços de trabalho.
  update: { isAdmin: true, isSystem: true },
});

// Idempotente: só define a senha se o usuário ainda não tiver uma (rodar de novo não falha nem a troca).
const hasPassword = await prisma.password.findFirst({ where: { user_id: user.id } });
if (!hasPassword) await registerNewPassword(user.id, password);
console.log(`Admin pronto: ${email}`);
await prisma.$disconnect();
