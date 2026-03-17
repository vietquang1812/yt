import { apiFetch } from "@/lib/api/client";
import { PromptDto } from "./type";

export async function getPrompts(channelId: string) {
  const res = await apiFetch<PromptDto[] | { items?: PromptDto[] }>(`/api/prompts?channelId=${channelId}`);
  return Array.isArray(res) ? res : (res.items ?? []);
}

export async function createPrompt(data: PromptDto) {
  const res = await apiFetch<PromptDto | { id?: string; prompt?: { id?: string } } | any>(`/api/prompts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res;
}

export async function updatePrompt(data: PromptDto) {
  const res = await apiFetch<PromptDto | { id: string; prompt?: { id: string } } | any>(`/api/prompts/${data.id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res;
}