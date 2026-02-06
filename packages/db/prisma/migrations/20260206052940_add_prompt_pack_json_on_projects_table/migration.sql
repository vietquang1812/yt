-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'PROMPT_CONTENT_READY';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "prompt_pack_json" JSONB,
ADD COLUMN     "prompt_pack_updated_at" TIMESTAMP(3),
ADD COLUMN     "prompt_pack_version" INTEGER NOT NULL DEFAULT 1;
