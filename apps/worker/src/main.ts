import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "./redis";
import { handlePipelineJob } from "./processors/pipeline";

function boot(queueName: string, concurrency = 3) {
  const w = new Worker(queueName, handlePipelineJob, { connection, concurrency });

  w.on("active", (job) => console.log(`[${queueName}] ACTIVE`, job.name, job.id));
  w.on("completed", (job) => console.log(`[${queueName}] DONE`, job.name, job.id, job.progress));
  w.on("failed", (job, err) => console.error(`[${queueName}] FAIL`, job?.name, job?.id, err));

  return w;
}

boot("pipeline", 2);
boot("llm", 2);
boot("assets", 2);
boot("media", 2);

console.log("Worker started.");
