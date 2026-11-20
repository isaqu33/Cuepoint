-- O EventLog passa a pertencer a um espaço de trabalho (isolamento do histórico e da linha do tempo).
ALTER TABLE "EventLog" ADD COLUMN "workspaceId" TEXT;

-- Backfill: espaço do arquivo ou do membro a que o evento se refere; entidades já excluídas caem no espaço padrão.
UPDATE "EventLog" e SET "workspaceId" = COALESCE(
  (SELECT l."workspaceId" FROM "Lesson" l WHERE l."id" = e."aggregateId"),
  (SELECT u."workspaceId" FROM "User" u WHERE u."id" = e."aggregateId"),
  'ws_default'
);

CREATE INDEX "EventLog_workspaceId_aggregateId_occurredAt_idx" ON "EventLog"("workspaceId", "aggregateId", "occurredAt");
