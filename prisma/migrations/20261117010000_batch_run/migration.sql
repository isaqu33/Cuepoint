-- CreateTable
CREATE TABLE "BatchRun" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "stats" JSONB,
    "error" TEXT,

    CONSTRAINT "BatchRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchRun_job_startedAt_idx" ON "BatchRun"("job", "startedAt");
