// apps/orchestrator-api/src/projects/prompts/promptLoader.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveConfigDir } from "../utils/paths";

export async function loadPrompt(name: string) {
  const cfgDir = resolveConfigDir();
  const file = path.join(cfgDir, "prompts", `${name}.md`);
  return fs.readFile(file, "utf8");
}

export async function loadConfigText(name: string) {
  const cfgDir = resolveConfigDir();
  const file = path.join(cfgDir, name);
  return fs.readFile(file, "utf8");
}
