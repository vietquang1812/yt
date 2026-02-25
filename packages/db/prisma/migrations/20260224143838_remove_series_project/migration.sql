/*
  Warnings:

  - You are about to drop the `_ProjectToSeries` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProjectToSeries" DROP CONSTRAINT "_ProjectToSeries_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectToSeries" DROP CONSTRAINT "_ProjectToSeries_B_fkey";

-- DropTable
DROP TABLE "_ProjectToSeries";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
