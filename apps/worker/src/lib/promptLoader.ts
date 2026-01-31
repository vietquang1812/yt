import fs from "node:fs/promises";
import path from "node:path";

export type PromptName =
  | "script_generate"
  | "script_refine"
  | "script_finalize"
  | "content_pack_generate"
  | "script_qa";

export async function loadPrompt(name: PromptName) {
  const base = process.env.PROMPT_DIR || "configs/prompts";
  const file = path.join(base, `${name}.md`);
  return fs.readFile(file, "utf8");
}
export async function loadConfigText(fileName: "persona.yaml" | "style_rules.yaml") {
  const base = process.env.CONFIG_DIR || "configs";
  const file = path.join(base, fileName);
  return fs.readFile(file, "utf8");
}
