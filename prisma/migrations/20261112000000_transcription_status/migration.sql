-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('IDLE', 'QUEUED', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Lesson"
  ADD COLUMN "transcriptionStatus" "TranscriptionStatus" NOT NULL DEFAULT 'IDLE',
  ADD COLUMN "transcriptionProgress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "transcriptionError" TEXT;

-- AlterTable
ALTER TABLE "Transcription"
  ADD COLUMN "vtt" TEXT,
  ADD COLUMN "language" TEXT;

-- Backfill: aulas que já têm transcrição ficam como prontas; as que estavam
-- "em andamento" no legado (sem consumidor garantido) voltam a ociosas.
UPDATE "Lesson" l SET "transcriptionStatus" = 'READY', "transcriptionProgress" = 100
  WHERE EXISTS (SELECT 1 FROM "Transcription" t WHERE t."lessonId" = l."id");
UPDATE "Lesson" SET "haveAnyTasncriptInProgresse" = false
  WHERE "transcriptionStatus" <> 'READY' AND "haveAnyTasncriptInProgresse" = true;
