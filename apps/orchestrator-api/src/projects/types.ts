// apps/orchestrator-api/src/projects/types.ts
import { ProjectStatus } from "@yt-ai/db";

export type CreateProjectDto = {
  topic: string;
  language?: string;
  durationMinutes?: number;
  format?: string;
  tone?: string;
  pillar?: string;
  seriesId?: string;
  continuityMode?: "none" | "light" | "occasionally_strong";
};

export type PromptStep = "prompt_generate_prompt_content" | "script_qa"| "script_refine";

export type PromptStatus = {
  step: PromptStep;
  exists: boolean;   // prompt file exists?
  enabled: boolean;  // button enabled?
  reason?: string | null;
};

export type UpdateProjectStatusInput = {
  id: string;
  status: ProjectStatus;
};
