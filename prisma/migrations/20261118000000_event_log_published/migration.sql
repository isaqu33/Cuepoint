-- Outbox do tópico de eventos: `publishedAt` marca o que já chegou ao tópico.
ALTER TABLE "EventLog" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Eventos antigos já foram entregues (ou perdidos há tempo demais para reenviar): não republicar.
UPDATE "EventLog" SET "publishedAt" = "occurredAt";

CREATE INDEX "EventLog_publishedAt_createdAt_idx" ON "EventLog"("publishedAt", "createdAt");
