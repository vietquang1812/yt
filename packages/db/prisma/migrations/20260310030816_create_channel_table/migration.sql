-- DropIndex
DROP INDEX "Project_seriesId_idx";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "channelId" TEXT;

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "pipeline" TEXT NOT NULL,
    "style_rules" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelPrompt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "channelId" TEXT,

    CONSTRAINT "ChannelPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_seriesId_channelId_idx" ON "Project"("seriesId", "channelId");

-- AddForeignKey
ALTER TABLE "ChannelPrompt" ADD CONSTRAINT "ChannelPrompt_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
