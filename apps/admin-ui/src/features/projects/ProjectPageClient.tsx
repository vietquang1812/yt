"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { refineAndReQA, runPipeline, setProjectStatus, getArtifactContent } from "./api";
import type { ArtifactDto } from "./types";

import { ProjectHeader } from "./components/ProjectHeader";
import { StatusBanner } from "./components/StatusBanner";
import { ProjectSummaryCard } from "./components/ProjectSummaryCard";
import { QaReportCard } from "./components/QaReportCard";
import { ScenesPromptsCard } from "./components/ScenesPromptsCard";
import { ArtifactsCard } from "./components/ArtifactsCard";
import { LiveStatusCard } from "./components/LiveStatusCard";

import { useProjectDetail } from "./hooks/useProjectDetail";
import { useQaPolling } from "./hooks/useQaPolling";

import { escapeHtml } from "./lib/html";
import { errorMessage } from "./lib/errors";
import type { StatusAlert } from "./lib/types";

export function ProjectPageClient({ projectId }: { projectId: string }) {
  const {
    project,
    setProject,
    artifacts,
    qaReport,
    segments,
    scenePlan,
    lastUpdated,
    refreshAll,
    loadArtifacts,
  } = useProjectDetail(projectId);

  const { startPolling, stopPolling } = useQaPolling(projectId);

  const [loading, setLoading] = useState(true);
  const [statusAlert, setStatusAlert] = useState<StatusAlert>(null);

  const [runBusy, setRunBusy] = useState(false);
  const [refineBusy, setRefineBusy] = useState(false);

  const [statusDraft, setStatusDraft] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const pendingActionRef = useRef<null | { kind: "run" | "refine"; startedAtISO: string }>(null);

  const queuesHref = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? "";
    return base ? `${base.replace(/\/$/, "")}/queues` : "/queues";
  }, []);

  const qaApproved = qaReport?.approved === true;
  const qaFailed = qaReport?.approved === false;
  const showRefine = qaFailed;

  async function onRun() {
    pendingActionRef.current = { kind: "run", startedAtISO: new Date().toISOString() };
    setStatusAlert({ variant: "info", html: `⏳ Running pipeline… This page will auto-reload after QA approves.` });
    setRunBusy(true);
    setRefineBusy(true);

    try {
      await runPipeline(projectId);
      await refreshAll();

      startPolling({
        startedAtISO: pendingActionRef.current.startedAtISO,
        onApproved: () => {
          setStatusAlert({ variant: "success", html: `✅ QA approved. Reloading…` });
          stopPolling();
          setTimeout(() => window.location.reload(), 700);
        },
        onFailed: () => {
          setStatusAlert({ variant: "warning", html: `⚠️ QA failed. You can refine and re-run QA.` });
          stopPolling();
          setRunBusy(false);
          setRefineBusy(false);
          pendingActionRef.current = null;
        },
      });
    } catch (e) {
      pendingActionRef.current = null;
      setRunBusy(false);
      setRefineBusy(false);
      setStatusAlert({ variant: "danger", html: `❌ Run failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>` });
    }
  }

  async function onRefine() {
    pendingActionRef.current = { kind: "refine", startedAtISO: new Date().toISOString() };
    setStatusAlert({ variant: "info", html: `✨ Refining… This page will auto-reload after QA approves.` });
    setRunBusy(true);
    setRefineBusy(true);

    try {
      await refineAndReQA(projectId);
      await refreshAll();

      startPolling({
        startedAtISO: pendingActionRef.current.startedAtISO,
        onApproved: () => {
          setStatusAlert({ variant: "success", html: `✅ QA approved. Reloading…` });
          stopPolling();
          setTimeout(() => window.location.reload(), 700);
        },
        onFailed: () => {
          setStatusAlert({ variant: "warning", html: `⚠️ QA failed. You can refine and re-run QA.` });
          stopPolling();
          setRunBusy(false);
          setRefineBusy(false);
          pendingActionRef.current = null;
        },
      });
    } catch (e) {
      pendingActionRef.current = null;
      setRunBusy(false);
      setRefineBusy(false);
      setStatusAlert({ variant: "danger", html: `❌ Refine failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>` });
    }
  }

  async function onSaveStatus() {
    if (!statusDraft) return;
    setStatusBusy(true);
    setStatusAlert({ variant: "info", html: `⏳ Updating status…` });

    try {
      const updated = await setProjectStatus(projectId, statusDraft);
      setProject(updated);
      setStatusDraft(String((updated as any)?.status ?? statusDraft));
      setStatusAlert({ variant: "success", html: `✅ Status updated.` });
    } catch (e) {
      setStatusAlert({ variant: "danger", html: `❌ Status update failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>` });
    } finally {
      setStatusBusy(false);
    }
  }

  async function onViewArtifact(a: ArtifactDto) {
    if (!a?.id) return;
    const w = window.open("", "_blank");
    if (!w) return;

    try {
      const r = await getArtifactContent(projectId, a.id);
      const text = typeof r?.content === "string" ? r.content : JSON.stringify(r, null, 2);
      w.document.write(
        `<pre style="white-space:pre-wrap;word-break:break-word;padding:16px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">${escapeHtml(text)}</pre>`
      );
      w.document.close();
    } catch (e) {
      w.document.write(`<pre>${escapeHtml(errorMessage(e))}</pre>`);
      w.document.close();
    }
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);

    refreshAll()
      .then((p) => setStatusDraft(String((p as any)?.status ?? "")))
      .catch((e) => {
        if (!alive) return;
        setStatusAlert({ variant: "danger", html: `❌ Load failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>` });
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div className="container py-4" style={{ maxWidth: 1100 }}>
      <ProjectHeader
        queuesHref={queuesHref}
        onRun={onRun}
        onRefine={onRefine}
        runBusy={runBusy}
        refineBusy={refineBusy}
        loading={loading}
        showRefine={showRefine}
      />

      <StatusBanner alert={statusAlert} />

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <ProjectSummaryCard
            project={project}
            projectId={projectId}
            artifacts={artifacts}
            statusDraft={statusDraft}
            setStatusDraft={setStatusDraft}
            statusBusy={statusBusy}
            onSaveStatus={onSaveStatus}
            loading={loading}
          />
          <QaReportCard qa={qaReport} />
        </div>

        <div className="col-12 col-lg-7">
          <ScenesPromptsCard segments={segments} scenePlan={scenePlan} setStatusAlert={setStatusAlert} />
          <ArtifactsCard artifacts={artifacts} loading={loading} lastUpdated={lastUpdated} onViewArtifact={onViewArtifact} />
          <LiveStatusCard />
        </div>
      </div>

      <style jsx global>{`
        body { background: #0b1220; }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }
        .accordion-button::after { filter: invert(1); opacity: 0.7; }
      `}</style>
    </div>
  );
}
