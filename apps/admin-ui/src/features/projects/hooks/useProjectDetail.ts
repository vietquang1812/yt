"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getArtifactContent,
  getProject,
  getProjectArtifacts,
} from "../api";
import type { ArtifactDto, ProjectDto, QaReportWithMeta } from "../types";
import { latestByType } from "../lib/artifacts";
import type { SegmentLike } from "../lib/types";
import { useMounted } from "./useMounted";

export function useProjectDetail(projectId: string) {
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactDto[]>([]);
  const [qaReport, setQaReport] = useState<QaReportWithMeta | null>(null);
  const [segments, setSegments] = useState<SegmentLike[] | null>(null);
  const [scenePlan, setScenePlan] = useState<any[] | null>(null);
  const mounted = useMounted();
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    if (!mounted) return;
    setLastUpdated(`Updated: ${new Date().toLocaleTimeString()}`);
  }, [mounted, artifacts.length, qaReport?.approved, segments?.length, scenePlan?.length]);

  const loadArtifacts = useCallback(async () => {
    const arts = await getProjectArtifacts(projectId);
    setArtifacts(arts);

    // QA
    const qaArt = latestByType(arts, "QA_REPORT_JSON");
    if (!qaArt) {
      setQaReport(null);
    } else {
      try {
        const r = await getArtifactContent(projectId, qaArt.id);
        const parsed = JSON.parse(r.content || "{}");
        setQaReport({ ...parsed, createdAt: qaArt.createdAt });
      } catch {
        setQaReport(null);
      }
    }

    // Segments
    const segArt = latestByType(arts, "SCRIPT_SEGMENTS_JSON");
    if (segArt) {
      try {
        const r = await getArtifactContent(projectId, segArt.id);
        const parsed = JSON.parse(r.content || "{}");
        setSegments(Array.isArray(parsed?.segments) ? parsed.segments : []);
      } catch {
        setSegments(null);
      }
    } else {
      setSegments(null);
    }

    // Scene Plan
    const sceneArt = latestByType(arts, "SCENE_PLAN_JSON");
    if (sceneArt) {
      try {
        const r = await getArtifactContent(projectId, sceneArt.id);
        const parsed = JSON.parse(r.content || "[]");
        setScenePlan(Array.isArray(parsed) ? parsed : []);
      } catch {
        setScenePlan(null);
      }
    } else {
      setScenePlan(null);
    }

    return arts;
  }, [projectId]);

  const refreshAll = useCallback(async () => {
    const p = await getProject(projectId);
    setProject(p);
    await loadArtifacts();
    return p;
  }, [projectId, loadArtifacts]);

  return {
    project,
    setProject,
    artifacts,
    qaReport,
    segments,
    scenePlan,
    lastUpdated,
    refreshAll,
    loadArtifacts,
  };
}
