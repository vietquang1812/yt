-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('IDEA_SELECTED', 'SCRIPT_QA_PASSED', 'VOICE_RENDERED', 'SCENES_PLANNED', 'ASSETS_FETCHED', 'VIDEO_RENDERED', 'SHORTS_RENDERED', 'THUMBNAIL_READY', 'METADATA_READY', 'SCHEDULED', 'PUBLISHED', 'ANALYTICS_INGESTED', 'SCRIPT_REFINED', 'SCRIPT_FINALIZED', 'FAILED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('SCRIPT_DRAFT_JSON', 'SCRIPT_REFINED_JSON', 'SCRIPT_FINAL_MD', 'QA_REPORT_JSON', 'IDEA_JSON', 'VOICE_WAV', 'TIMESTAMPS_JSON', 'SCENE_PLAN_JSON', 'VIDEO_FINAL_MP4', 'SHORT_MP4', 'THUMB_PNG', 'METADATA_JSON');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "durationMinutes" INTEGER NOT NULL DEFAULT 6,
    "format" TEXT NOT NULL DEFAULT 'youtube_long',
    "tone" TEXT,
    "pillar" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'IDEA_SELECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "filename" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "youtubeVideoId" TEXT,
    "ctr" DOUBLE PRECISION,
    "avgViewDuration" DOUBLE PRECISION,
    "retention30s" DOUBLE PRECISION,
    "views7d" INTEGER,
    "subsGained7d" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Artifact_projectId_type_idx" ON "Artifact"("projectId", "type");

-- CreateIndex
CREATE INDEX "Job_projectId_name_idx" ON "Job"("projectId", "name");

-- CreateIndex
CREATE INDEX "Analytics_projectId_capturedAt_idx" ON "Analytics"("projectId", "capturedAt");

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
