import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "./redis";
import { handlePipelineJob } from "./processors/pipeline";

function boot(queueName: string, concurrency?: number) {
  const w = new Worker(queueName, handlePipelineJob, { connection, concurrency });
  w.on("completed", (job) => console.log(`[${queueName}] OK`, job.name, job.id, job.progress));
  w.on("failed", (job, err) => console.error(`[${queueName}] FAIL`, job?.name, job?.id, err));
  return w;
}
boot("pipeline", 5); boot("llm", 3); boot("assets", 3); boot("media", 2);
console.log("Worker started");
