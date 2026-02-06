export type PipelineStep =
  | "prompt_generate_prompt_content"
  | "script_refine"
  | "script_qa"
  | "thumbnail_generate"
  | "script_segments_generate";
