import fs from "node:fs/promises";
import path from "node:path";

export async function loadPrompt(name: "script_generate" | "script_refine" | "script_finalize") {
  const base = process.env.PROMPT_DIR || "configs/prompts";
  const file = path.join(base, `${name}.md`);
  return fs.readFile(file, "utf8");
}
