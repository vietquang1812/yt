import type { Job } from "bullmq";

export async function setProgress(job: Job, value: number, msg?: string) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  await job.updateProgress(msg ? { value: v, msg } : v);
}
