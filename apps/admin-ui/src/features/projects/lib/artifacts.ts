import type { ArtifactDto } from "../types";

export function latestByType(arts: ArtifactDto[], type: string) {
  const list = arts.filter((a) => a.type === type);
  if (!list.length) return null;
  return [...list].sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  )[0];
}

export function badgeStyle() {
  return {
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.12)",
    color: "rgba(255,255,255,.85)",
  } as const;
}
