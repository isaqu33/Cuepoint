-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "workspaceId" TEXT NOT NULL DEFAULT 'ws_default';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "sizeBytes" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "workspaceId" TEXT NOT NULL DEFAULT 'ws_default';

-- AlterTable
ALTER TABLE "Serie" ADD COLUMN     "workspaceId" TEXT NOT NULL DEFAULT 'ws_default';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "workspaceId" TEXT NOT NULL DEFAULT 'ws_default';

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "maxFiles" INTEGER,
    "maxStorageBytes" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "mediaFileId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_tokenHash_key" ON "ShareLink"("tokenHash");

-- CreateIndex
CREATE INDEX "ShareLink_mediaFileId_idx" ON "ShareLink"("mediaFileId");

-- CreateIndex
CREATE INDEX "ShareLink_workspaceId_expiresAt_idx" ON "ShareLink"("workspaceId", "expiresAt");

-- CreateIndex
CREATE INDEX "Course_workspaceId_idx" ON "Course"("workspaceId");

-- CreateIndex
CREATE INDEX "Lesson_workspaceId_idx" ON "Lesson"("workspaceId");

-- CreateIndex
CREATE INDEX "Serie_workspaceId_idx" ON "Serie"("workspaceId");

-- Espaço padrão: todo dado existente (e todo insert da versão anterior, via DEFAULT) cai aqui. Migração compatível.
INSERT INTO "Workspace" ("id", "name", "slug", "createdAt") VALUES ('ws_default', 'Principal', 'principal', CURRENT_TIMESTAMP);

-- Preenche o tamanho dos arquivos já existentes a partir dos registros de File (o campo size guarda texto/JSON).
UPDATE "Lesson" l SET "sizeBytes" = COALESCE((
  SELECT SUM(NULLIF(regexp_replace(f."size", '[^0-9]', '', 'g'), '')::bigint)
  FROM "File" f JOIN "_FileToLesson" fl ON fl."A" = f."id" WHERE fl."B" = l."id"
), 0);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Serie" ADD CONSTRAINT "Serie_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_mediaFileId_fkey" FOREIGN KEY ("mediaFileId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

