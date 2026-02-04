const BASE = (process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

export function artifactContentUrl(projectId: string, artifactId: string) {
  return `${BASE}/admin/api/projects/${projectId}/artifacts/${artifactId}/content`;
}

export function queuesUrl() {
  return `${BASE}/queues`;
}
