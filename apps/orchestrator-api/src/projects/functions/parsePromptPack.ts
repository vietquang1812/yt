import { PromptPackJson } from "../types";
import { Prisma } from "@prisma/client";

export function parsePromptPack(
  json: Prisma.JsonValue | null
): PromptPackJson | null {
  if (
    typeof json === "object" &&
    json !== null &&
    !Array.isArray(json)
  ) {
    return json as PromptPackJson;
  }
  return null;
}
