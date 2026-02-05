import { apiFetch } from "@/lib/api/client";
import type { CreateSeriesDto, SeriesDto, UpdateSeriesDto } from "./types";

export async function getSeries() {
  const res = await apiFetch<SeriesDto[] | { items?: SeriesDto[] }>("/api/series");
  return Array.isArray(res) ? res : (res.items ?? []);
}

export function createSeries(body: CreateSeriesDto) {
  return apiFetch<SeriesDto | { id: string } | any>("/api/series", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getSeriesById(seriesId: string) {
  return apiFetch<SeriesDto>(`/api/series/${seriesId}`);
}

export function updateSeries(seriesId: string, body: UpdateSeriesDto) {
  return apiFetch<SeriesDto>(`/api/series/${seriesId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
