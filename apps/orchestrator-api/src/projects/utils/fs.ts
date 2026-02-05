// apps/orchestrator-api/src/projects/utils/fs.ts
import * as fs from "node:fs/promises";

export async function readIfExists(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}
