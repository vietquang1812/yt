import type { Job } from "bullmq";
import type { Project } from "@yt-ai/db";
import { setProgress } from "../progress";

export async function handleThumbnailGenerate(job: Job, _project: Project) {
  await setProgress(job, 100, "skipped (not implemented)");
}
