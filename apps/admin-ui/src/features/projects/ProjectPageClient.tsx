"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { refineAndReQA, runPipeline, setProjectStatus, getArtifactContent, runScriptSegments } from "./api";
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
import { latestByType } from "./lib/artifacts";
import { AllScriptJsonCard } from "./components/AllScriptJsonCard";

function asTimeMs(d: any) {
  const t = d ? new Date(d).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

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
  const [segmentsBusy, setSegmentsBusy] = useState(false);

  const [statusDraft, setStatusDraft] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const pendingActionRef = useRef<null | { kind: "run" | "refine" | "segments"; startedAtISO: string }>(null);
  const actionPollTimerRef = useRef<number | null>(null);

  const queuesHref = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? "";
    return base ? `${base.replace(/\/$/, "")}/queues` : "/queues";
  }, []);

  // ✅ “metadata_generate đã xong” ~ có script final hoặc metadata json
  const hasMetadata =
    !!latestByType(artifacts, "SCRIPT_FINAL_MD") || !!latestByType(artifacts, "METADATA_JSON");

  // ✅ Refine & Segments chỉ hiện sau metadata_generate
  const showRefine = hasMetadata;
  const showSegments = hasMetadata;

  function clearActionPoll() {
    if (actionPollTimerRef.current) {
      window.clearTimeout(actionPollTimerRef.current);
      actionPollTimerRef.current = null;
    }
  }

  async function pollUntilArtifactUpdated(opts: {
    startedAtISO: string;
    type: string;
    onDone: (a: any) => void;
    onTimeout?: () => void;
    timeoutMs?: number;
    intervalMs?: number;
  }) {
    const {
      startedAtISO,
      type,
      onDone,
      onTimeout,
      timeoutMs = 10 * 60_000,
      intervalMs = 1500,
    } = opts;

    clearActionPoll();
    const startedAtMs = asTimeMs(startedAtISO);
    const deadline = Date.now() + timeoutMs;

    const tick = async () => {
      try {
        const nextArtifacts = await loadArtifacts();
        const a = latestByType(nextArtifacts, type as any);

        const createdAtMs = asTimeMs((a as any)?.createdAt);
        if (a && createdAtMs >= startedAtMs) {
          onDone(a);
          return;
        }

        if (Date.now() > deadline) {
          onTimeout?.();
          return;
        }

        actionPollTimerRef.current = window.setTimeout(tick, intervalMs);
      } catch {
        // fail soft; keep polling
        actionPollTimerRef.current = window.setTimeout(tick, intervalMs);
      }
    };

    actionPollTimerRef.current = window.setTimeout(tick, 600);
  }

  async function onRun() {
    pendingActionRef.current = { kind: "run", startedAtISO: new Date().toISOString() };
    setStatusAlert({ variant: "info", html: `⏳ Running metadata… QA will run automatically after metadata completes.` });
    setRunBusy(true);
    setRefineBusy(true);
    setSegmentsBusy(true);

    try {
      await runPipeline(projectId);
      await refreshAll();

      // ✅ vẫn poll QA vì QA chạy tự động sau metadata_generate
      startPolling({
        startedAtISO: pendingActionRef.current.startedAtISO,
        onApproved: () => {
          setStatusAlert({ variant: "success", html: `✅ QA approved. Reloading…` });
          stopPolling();
          setTimeout(() => window.location.reload(), 700);
        },
        onFailed: () => {
          setStatusAlert({ variant: "warning", html: `⚠️ QA failed. You can refine (manual) and try again.` });
          stopPolling();
          setRunBusy(false);
          setRefineBusy(false);
          setSegmentsBusy(false);
          pendingActionRef.current = null;
        },
      });
    } catch (e) {
      pendingActionRef.current = null;
      setRunBusy(false);
      setRefineBusy(false);
      setSegmentsBusy(false);
      setStatusAlert({ variant: "danger", html: `❌ Run failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>` });
    }
  }

  async function onRefine() {
    // ✅ Manual refine only (không chờ QA auto trong UI)
    pendingActionRef.current = { kind: "refine", startedAtISO: new Date().toISOString() };
    setStatusAlert({ variant: "info", html: `✨ Refining script… This page will reload when refine is done.` });
    setRefineBusy(true);

    try {
      await refineAndReQA(projectId);
      await refreshAll();

      // ✅ Poll artifact update thay vì QA:
      // - ưu tiên SCRIPT_FINAL_MD (script mới)
      // - nếu bạn refine lưu loại khác, đổi type cho phù hợp
      await pollUntilArtifactUpdated({
        startedAtISO: pendingActionRef.current.startedAtISO,
        type: "SCRIPT_FINAL_MD",
        onDone: () => {
          setStatusAlert({ variant: "success", html: `✅ Refine done. Reloading…` });
          setRefineBusy(false);
          pendingActionRef.current = null;
          clearActionPoll();
          setTimeout(() => window.location.reload(), 700);
        },
        onTimeout: () => {
          setRefineBusy(false);
          pendingActionRef.current = null;
          setStatusAlert({ variant: "warning", html: `⚠️ Refine is taking longer than expected. Please refresh or check queues.` });
        },
      });
    } catch (e) {
      pendingActionRef.current = null;
      setRefineBusy(false);
      setStatusAlert({ variant: "danger", html: `❌ Refine failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>` });
    }
  }

  async function onSegments() {
    pendingActionRef.current = { kind: "segments", startedAtISO: new Date().toISOString() };
    setStatusAlert({ variant: "info", html: `🧩 Generating script segments… This page will reload when done.` });
    setSegmentsBusy(true);

    try {
      await runScriptSegments(projectId);
      await refreshAll();

      await pollUntilArtifactUpdated({
        startedAtISO: pendingActionRef.current.startedAtISO,
        type: "SCRIPT_SEGMENTS_JSON",
        onDone: () => {
          setStatusAlert({ variant: "success", html: `✅ Segments generated. Reloading…` });
          setSegmentsBusy(false);
          pendingActionRef.current = null;
          clearActionPoll();
          setTimeout(() => window.location.reload(), 700);
        },
        onTimeout: () => {
          setSegmentsBusy(false);
          pendingActionRef.current = null;
          setStatusAlert({ variant: "warning", html: `⚠️ Segments generation is taking longer than expected. Please refresh or check queues.` });
        },
      });
    } catch (e) {
      pendingActionRef.current = null;
      setSegmentsBusy(false);
      setStatusAlert({ variant: "danger", html: `❌ Segments failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>` });
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
      const text = typeof (r as any)?.content === "string" ? (r as any).content : JSON.stringify(r, null, 2);
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
      clearActionPoll();
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

      {/* ✅ Manual Segments button (hiện sau metadata_generate) */}
      <div className="d-flex gap-2 align-items-center mb-3">
        <button
          className={`btn btn-outline-info ${showSegments ? "" : "d-none"}`}
          onClick={onSegments}
          disabled={segmentsBusy || loading || runBusy}
          title={!hasMetadata ? "Run metadata first" : "Generate segments from the latest script"}
        >
          Generate Segments
          <span className={`spinner-border spinner-border-sm ms-2 ${segmentsBusy ? "" : "d-none"}`} />
        </button>

        <div className="small text-muted">
          {!hasMetadata ? "Run to generate metadata first." : "Refine / Segments are manual actions after metadata."}
        </div>
      </div>

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
      <div className="row mt-3">
        <div className="col-12">
          <div className="card">
          <div className="card-header">
            <h2 className="text-">Data</h2>
          </div>
          <div className="card-body">
            <div className="mt-3">
              <AllScriptJsonCard projectId={projectId} />
            </div>
          </div>
        </div>
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
