import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";

export type PipelineStepConfig = {
  name: string;
  depends_on?: string[];
};

export type PipelineConfig = {
  pipeline: PipelineStepConfig[];
};

export function loadPipelineConfig(): PipelineConfig {
  // chạy trong Docker thì cwd thường là /app/apps/orchestrator-api
  // chạy local thì cwd là apps/orchestrator-api
  // nên dùng process.cwd() để ổn định
  const filePath = process.env.PIPELINE_CONFIG ||
  path.join(process.env.CONFIG_DIR || "/app/configs", "pipeline.yaml");

  const raw = fs.readFileSync(filePath, "utf8");
  const data = yaml.load(raw) as PipelineConfig;

  if (!data?.pipeline || !Array.isArray(data.pipeline)) {
    throw new Error("Invalid pipeline.yaml: missing `pipeline` array");
  }

  for (const step of data.pipeline) {
    if (!step?.name) throw new Error("Invalid pipeline.yaml: step missing `name`");
    if (step.depends_on && !Array.isArray(step.depends_on)) {
      throw new Error(`Invalid pipeline.yaml: depends_on must be array for step ${step.name}`);
    }
  }

  return data;
}
