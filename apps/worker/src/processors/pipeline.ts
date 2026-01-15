import { Job } from "bullmq";
import { prisma, ArtifactType, JobStatus, ProjectStatus } from "@yt-ai/db";
import { ArtifactStorage } from "@yt-ai/common";
import { setProgress } from "../utils/progress";


export async function handlePipelineJob(job: Job<any>) {
  const { projectId, step } = job.data;
  const storage = new ArtifactStorage((process.env.STORAGE_DRIVER as any) || "local", process.env.STORAGE_DIR || "storage/projects");

  await setProgress(job, 1, "starting");

  if (step === "script_generate") {
    await setProgress(job, 50, "writing script draft");
    const put = await storage.put(projectId, "script_draft.md", Buffer.from("# Title\n\nHello world\n", "utf8"));
    await prisma.artifact.create({ data: { projectId, type: ArtifactType.SCRIPT_DRAFT, uri: put.uri, meta: put.meta } });
    await setProgress(job, 100, "done");
  } else {
    // noop for other steps in minimal worker
    await setProgress(job, 100, "done (stub)");
  }
}
