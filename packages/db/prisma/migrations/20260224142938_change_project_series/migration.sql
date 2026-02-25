-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_seriesId_fkey";

-- CreateTable
CREATE TABLE "_ProjectToSeries" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToSeries_AB_unique" ON "_ProjectToSeries"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectToSeries_B_index" ON "_ProjectToSeries"("B");

-- AddForeignKey
ALTER TABLE "_ProjectToSeries" ADD CONSTRAINT "_ProjectToSeries_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToSeries" ADD CONSTRAINT "_ProjectToSeries_B_fkey" FOREIGN KEY ("B") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
