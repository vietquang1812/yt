// apps/orchestrator-api/src/projects/utils/paths.ts
import { BadRequestException } from "@nestjs/common";
import * as path from "node:path";
import * as fssync from "node:fs";

export function safeProjectId(projectId: string) {
  if (!projectId || projectId.includes("/") || projectId.includes("\\") || projectId.includes("..")) {
    throw new BadRequestException("Invalid projectId");
  }
  return projectId;
}

export function resolveStorageDir(): string {
  const envDir = process.env.STORAGE_DIR || "storage/projects";
  return path.isAbsolute(envDir) ? envDir : path.join(process.cwd(), envDir);
}

export function projectRootDir(projectId: string) {
  const storage = resolveStorageDir();
  return path.join(storage, safeProjectId(projectId));
}

export function promptFilePath(projectId: string, step: string) {
  const root = projectRootDir(projectId);
  return path.join(root, "prompts", `${step}.txt`);
}

export function resolveConfigDir(): string {
  const candidates = [
    process.env.CONFIG_DIR,
    "/app/configs",
    path.join(process.cwd(), "configs"),
    path.join(process.cwd(), "..", "..", "configs"),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    try {
      if (fssync.existsSync(c) && fssync.statSync(c).isDirectory()) return c;
    } catch {}
  }
  return path.join(process.cwd(), "configs");
}
