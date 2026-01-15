import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type StorageDriver = "local" | "s3";
export type PutResult = { uri: string; meta: Record<string, any> };

export class ArtifactStorage {
  constructor(private readonly driver: StorageDriver, private readonly baseDir: string) {}

  async put(projectId: string, filename: string, data: Buffer): Promise<PutResult> {
    if (this.driver !== "local") throw new Error("S3 driver not implemented in MVP");
    const dir = path.join(this.baseDir, projectId);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, data);
    const sha256 = crypto.createHash("sha256").update(data).digest("hex");
    return { uri: filePath, meta: { sha256, bytes: data.length } };
  }

  async read(uri: string): Promise<Buffer> {
    return fs.readFile(uri);
  }
}
