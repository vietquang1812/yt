"use client";

import { useCallback, useRef } from "react";
import { getArtifactContent, getProjectArtifacts } from "../api";
import { latestByType } from "../lib/artifacts";
import type { QaReportWithMeta } from "../types";

export function useQaPolling(projectId: string) {
  const pollTimerRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback((args: {
    startedAtISO: string;
    onApproved: (qa: QaReportWithMeta) => void;
    onFailed: (qa: QaReportWithMeta) => void;
    onTick?: (qa: QaReportWithMeta | null) => void;
  }) => {
    stopPolling();
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const arts = await getProjectArtifacts(projectId);
        const qaArt = latestByType(arts, "QA_REPORT_JSON");
        if (!qaArt) return;

        let qa: QaReportWithMeta | null = null;
        try {
          const r = await getArtifactContent(projectId, qaArt.id);
          const parsed = JSON.parse(r.content || "{}");
          qa = { ...parsed, createdAt: qaArt.createdAt };
        } catch {
          qa = null;
        }

        args.onTick?.(qa);

        if (!qa) return;
        const actionStart = new Date(args.startedAtISO).getTime();
        const qaCreated = qa?.createdAt ? new Date(qa.createdAt).getTime() : null;
        const isNewEnough = qaCreated === null ? true : qaCreated >= actionStart;
        if (!isNewEnough) return;

        if (qa.approved === true) args.onApproved(qa);
        if (qa.approved === false) args.onFailed(qa);
      } catch {
        // silent
      }
    }, 3000);
  }, [projectId, stopPolling]);

  return { startPolling, stopPolling };
}
