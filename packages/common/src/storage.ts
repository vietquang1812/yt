import fs from "node:fs/promises";
import path from "node:path";

export type PutResult = {
  uri: string;
  meta: { bytes: number; filename: string };
};

export class ArtifactStorage {
  constructor(private driver: "local", private baseDir: string) {}

  async put(projectId: string, filename: string, data: Buffer): Promise<PutResult> {
    if (this.driver !== "local") throw new Error("Only local storage is implemented");

    const dir = path.join(this.baseDir, projectId);
    await fs.mkdir(dir, { recursive: true });

    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, data);

    return {
      uri: filepath, // lưu absolute/relative tùy bạn; hiện đang lưu path trong container
      meta: { bytes: data.length, filename },
    };
  }
}
