-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "channelId" TEXT;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
