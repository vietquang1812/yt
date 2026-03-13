export type ContinuityMode = "none" | "light" | "occasionally_strong";

export type CreateProjectDto = {
  topic: string;
  language?: string;
  durationMinutes?: number;
  format?: string;
  tone?: string;
  pillar?: string;
  seriesId?: string;
  series?: any;
  continuityMode?: ContinuityMode;
};

// Backend Project trả về thường có thêm id/status (và có thể timestamps)
export type ProjectDto = CreateProjectDto & {
  id: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ArtifactDto = {
  id: string;
  type?: string;
  filename?: string;
  createdAt?: string;
  meta?: any;
};

export type ArtifactListResponse = ArtifactDto[] | { items?: ArtifactDto[] };

export type ArtifactContentResponse = {
  content: string; // md/plain text OR json string
};

export type QaReport = {
  approved?: boolean; // true/false/undefined
  summary?: string;
  issues?: unknown;
};

// Khi poll, ta cần createdAt của artifact QA để so với action start
export type QaReportWithMeta = QaReport & { createdAt?: string };

/* =======================
   Types PromptPackPart
======================= */

export type PromptPackPart = {
  part: number;
  role?: string;
  word_count?: number;
  target_words?: string;
  generation_prompt: string;
  content?: string;
};

export type ProjectType = {
  id: String
  topic: String
  language: String
  durationMinutes: number
  format: String
  tone: String
  pillar: String

  // NEW: link to Series
  seriesId: String

  artifacts: []
  jobs: []
  analytics: []

  qa_json: JSON;
  prompt_pack_json: JSON;

}