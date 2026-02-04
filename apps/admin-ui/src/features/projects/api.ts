import { apiFetch } from "@/lib/api/client";
import type {
  CreateProjectDto,
  ProjectDto,
  ArtifactListResponse,
  ArtifactContentResponse,
} from "./types";

// list
export async function getProjects() {
  const res = await apiFetch<ProjectDto[] | { items?: ProjectDto[] }>("/api/projects");
  return Array.isArray(res) ? res : (res.items ?? []);
}

// create
export function createProject(body: CreateProjectDto) {
  return apiFetch<ProjectDto | { id?: string; project?: { id?: string } } | any>("/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function setProjectStatus(projectId: string, status: string) {
  return apiFetch<ProjectDto>(`/api/projects/${projectId}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export function getProject(projectId: string) {
  return apiFetch<ProjectDto>(`/api/projects/${projectId}`);
}

// artifacts (giữ nguyên như trước)
export async function getProjectArtifacts(projectId: string) {
  const res = await apiFetch<ArtifactListResponse>(`/api/projects/${projectId}/artifacts`);
  return Array.isArray(res) ? res : (res?.items ?? []);
}

export function getArtifactContent(projectId: string, artifactId: string) {
  return apiFetch<ArtifactContentResponse>(
    `/api/projects/${projectId}/artifacts/${artifactId}/content`
  );
}

export function runPipeline(projectId: string) {
  return apiFetch<string>(`/api/projects/${projectId}/run`, { method: "POST" });
}

export function refineAndReQA(projectId: string) {
  return apiFetch<string>(`/api/projects/${projectId}/refine`, { method: "POST" });
}
