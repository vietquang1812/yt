// apps/orchestrator-api/src/projects/constants.ts
export const TEXT_ARTIFACT_TYPES = new Set([
  "SCRIPT_FINAL_MD",
  "SCENE_PLAN_JSON",
  "METADATA_JSON",
  "QA_REPORT_JSON",
  "SCRIPT_SEGMENTS_JSON",
  "NEXT_IDEAS_JSON",
  "LLM_PROMPT_TEXT",
]);

export const ALLOWED_PREVIEW_STEPS = new Set([
  "prompt_generate_prompt_content",
  "script_qa",
  "script_refine",
  "script_segments_generate",
  "thumbnail_generate",
]);
