"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getArtifactContent,
  getProject,
  getProjectArtifacts,
  refineAndReQA,
  runPipeline,
} from "./api";
import type { ArtifactDto, ProjectDto, QaReportWithMeta } from "./types";
import type { ApiError } from "@/lib/api/client";

function fmtTime(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function escapeHtml(str: string) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function latestByType(arts: ArtifactDto[], type: string) {
  const list = arts.filter((a) => a.type === type);
  if (!list.length) return null;
  return [...list].sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  )[0];
}

function errorMessage(e: unknown) {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) return String((e as any).message);
  const ae = e as Partial<ApiError>;
  if (ae?.message) return ae.message;
  return "Request failed";
}

type StatusAlert = { variant: "info" | "success" | "warning" | "danger"; html: string } | null;

export function ProjectPageClient({ projectId }: { projectId: string }) {
  console.log(`ProjectPageClient ${projectId}`)
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactDto[]>([]);
  const [qaReport, setQaReport] = useState<QaReportWithMeta | null>(null);

  const [loading, setLoading] = useState(true);
  const [statusAlert, setStatusAlert] = useState<StatusAlert>(null);

  const [runBusy, setRunBusy] = useState(false);
  const [refineBusy, setRefineBusy] = useState(false);

  const pendingActionRef = useRef<null | { kind: "run" | "refine"; startedAtISO: string }>(null);
  const pollTimerRef = useRef<number | null>(null);

  const lastUpdated = useMemo(() => {
    return `Updated: ${new Date().toLocaleTimeString()}`;
  }, [artifacts.length, qaReport?.approved]); // simple trigger

  const queuesHref = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? "";
    // HTML cũ dùng /queues relative trên bull-board host
    return base ? `${base.replace(/\/$/, "")}/queues` : "/queues";
  }, []);

  function stopPolling() {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  async function loadArtifactsAndQA(): Promise<{ artifacts: ArtifactDto[]; qa: QaReportWithMeta | null }> {
    const arts = await getProjectArtifacts(projectId);
    setArtifacts(arts);

    // QA report logic giống HTML cũ:
    const qaArt = latestByType(arts, "QA_REPORT_JSON");
    if (!qaArt) {
      setQaReport(null);
      return { artifacts: arts, qa: null };
    }

    try {
      const r = await getArtifactContent(projectId, qaArt.id);
      const parsed = JSON.parse(r.content || "{}");
      const qa: QaReportWithMeta = { ...parsed, createdAt: qaArt.createdAt };
      setQaReport(qa);
      return { artifacts: arts, qa };
    } catch {
      setQaReport(null);
      return { artifacts: arts, qa: null };
    }
  }

  async function refreshAll() {
    console.log(`refreshAll ${projectId}`)
    const p = await getProject(projectId);
    setProject(p);
    return loadArtifactsAndQA();
  }

  function startPolling() {
    stopPolling();
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const { qa } = await loadArtifactsAndQA();
        const pending = pendingActionRef.current;
        if (!pending) return;

        const actionStart = new Date(pending.startedAtISO).getTime();
        const qaCreated = qa?.createdAt ? new Date(qa.createdAt).getTime() : null;
        const isNewEnough = qaCreated === null ? true : qaCreated >= actionStart;

        if (qa && isNewEnough) {
          if (qa.approved === true) {
            setStatusAlert({ variant: "success", html: `✅ QA approved. Reloading…` });
            stopPolling();
            setTimeout(() => window.location.reload(), 700);
            return;
          }

          if (qa.approved === false) {
            setStatusAlert({ variant: "warning", html: `⚠️ QA failed. You can refine and re-run QA.` });
            stopPolling();
            setRunBusy(false);
            setRefineBusy(false);
            pendingActionRef.current = null;
            return;
          }
        }
      } catch {
        // silent retry
      }
    }, 3000);
  }

  async function onRun() {
    pendingActionRef.current = { kind: "run", startedAtISO: new Date().toISOString() };
    setStatusAlert({
      variant: "info",
      html: `⏳ Running pipeline… This page will auto-reload after QA approves.`,
    });
    setRunBusy(true);
    setRefineBusy(true);

    try {
      await runPipeline(projectId);
      await refreshAll();
      startPolling();
    } catch (e) {
      pendingActionRef.current = null;
      setRunBusy(false);
      setRefineBusy(false);
      setStatusAlert({
        variant: "danger",
        html: `❌ Run failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>`,
      });
    }
  }

  async function onRefine() {
    pendingActionRef.current = { kind: "refine", startedAtISO: new Date().toISOString() };
    setStatusAlert({
      variant: "info",
      html: `✨ Refining… This page will auto-reload after QA approves.`,
    });
    setRunBusy(true);
    setRefineBusy(true);

    try {
      await refineAndReQA(projectId);
      await refreshAll();
      startPolling();
    } catch (e) {
      pendingActionRef.current = null;
      setRunBusy(false);
      setRefineBusy(false);
      setStatusAlert({
        variant: "danger",
        html: `❌ Refine failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>`,
      });
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
        `<pre style="white-space:pre-wrap;word-break:break-word;padding:16px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">${escapeHtml(
          text
        )}</pre>`
      );
      w.document.close();
    } catch (e) {
      w.document.write(`<pre>${escapeHtml(errorMessage(e))}</pre>`);
      w.document.close();
    }
  }

  // Boot
  useEffect(() => {
    let alive = true;
    setLoading(true);

    refreshAll()
      .catch((e) => {
        if (!alive) return;
        setStatusAlert({
          variant: "danger",
          html: `❌ Load failed: <span class="mono">${escapeHtml(errorMessage(e))}</span>`,
        });
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const scriptArt = latestByType(artifacts, "SCRIPT_FINAL_MD");
  const metaArt = latestByType(artifacts, "METADATA_JSON");
  const qaArt = latestByType(artifacts, "QA_REPORT_JSON");

  const qaApproved = qaReport?.approved === true;
  const qaFailed = qaReport?.approved === false;

  // UI decisions (giống HTML cũ)
  const showRefine = qaFailed; // chỉ show refine khi fail

  return (
    <div className="container py-4" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <Link className="link-light opacity-75" href="/projects">
              ← Projects
            </Link>
            <span className="opacity-50">/</span>
            <span className="fw-semibold">Project</span>
          </div>
          <h1 className="h4 mt-2 mb-1">Content Pipeline</h1>
          <div className="text-secondary">Orchestrator API • BullMQ • Worker</div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <a className="btn btn-outline-light" href={queuesHref} target="_blank" rel="noreferrer">
            Open Queues
          </a>

          <button className="btn btn-primary" onClick={onRun} disabled={runBusy || loading}>
            <span className="me-2">Run pipeline</span>
            <span
              className={`spinner-border spinner-border-sm ${runBusy ? "" : "d-none"}`}
              role="status"
              aria-hidden="true"
            />
          </button>

          <button
            className={`btn btn-warning text-dark ${showRefine ? "" : "d-none"}`}
            onClick={onRefine}
            disabled={refineBusy || loading}
          >
            <span className="me-2">Refine &amp; Re-QA</span>
            <span
              className={`spinner-border spinner-border-sm ${refineBusy ? "" : "d-none"}`}
              role="status"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusAlert ? (
        <div className={`alert alert-${statusAlert.variant} border-0 rounded-4`} role="alert">
          <span dangerouslySetInnerHTML={{ __html: statusAlert.html }} />
        </div>
      ) : null}

      <div className="row g-3">
        {/* Left */}
        <div className="col-12 col-lg-5">
          <div className="card bg-dark text-white border-0" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-secondary small">Project ID</div>
                  <div className="mono">{project?.id ?? projectId}</div>
                </div>
                <span className="badge" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)" }}>
                  {project?.status ?? "—"}
                </span>
              </div>

              <hr className="border-secondary border-opacity-25" />

              <div className="mb-2">
                <div className="text-secondary small">Topic</div>
                <div className="fw-semibold">{project?.topic ?? "—"}</div>
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <div className="text-secondary small">Language</div>
                  <div>{project?.language ?? "en"}</div>
                </div>
                <div className="col-6">
                  <div className="text-secondary small">Format</div>
                  <div>{project?.format ?? "youtube_long"}</div>
                </div>
                <div className="col-6">
                  <div className="text-secondary small">Duration</div>
                  <div>{project?.durationMinutes ? `${project.durationMinutes} min` : "—"}</div>
                </div>
                <div className="col-6">
                  <div className="text-secondary small">Pillar/Angle</div>
                  <div>{project?.pillar ?? "—"}</div>
                </div>
              </div>

              <hr className="border-secondary border-opacity-25" />

              <div className="d-flex flex-wrap gap-2">
                {scriptArt ? (
                  <a
                    className="btn btn-outline-light"
                    href={`${process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? ""}/admin/api/projects/${projectId}/artifacts/${scriptArt.id}/content`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open script_final.md
                  </a>
                ) : null}

                {metaArt ? (
                  <a
                    className="btn btn-outline-light"
                    href={`${process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? ""}/admin/api/projects/${projectId}/artifacts/${metaArt.id}/content`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open metadata.json
                  </a>
                ) : null}

                {qaArt ? (
                  <a
                    className="btn btn-outline-light"
                    href={`${process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? ""}/admin/api/projects/${projectId}/artifacts/${qaArt.id}/content`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open qa_report.json
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* QA details */}
          {qaReport ? (
            <div className="card bg-dark text-white border-0 mt-3" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">QA Report</div>
                    <div className="text-secondary small mt-1">{qaReport.summary ?? "—"}</div>
                  </div>
                  <span
                    className={`badge ${
                      qaApproved ? "bg-success" : qaFailed ? "bg-danger" : "bg-secondary"
                    }`}
                  >
                    {qaApproved ? "APPROVED" : qaFailed ? "FAILED" : "UNKNOWN"}
                  </span>
                </div>

                <hr className="border-secondary border-opacity-25" />

                <div className="text-secondary small mb-2">Issues</div>
                <pre className="mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {JSON.stringify(qaReport.issues ?? [], null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right */}
        <div className="col-12 col-lg-7">
          <div className="card bg-dark text-white border-0" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-semibold">Artifacts</div>
                <div className="text-secondary small">{lastUpdated}</div>
              </div>

              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>Type</th>
                      <th>Filename</th>
                      <th style={{ width: "18%" }}>Created</th>
                      <th style={{ width: "16%" }} />
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-secondary">
                          Loading…
                        </td>
                      </tr>
                    ) : artifacts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-secondary">
                          No artifacts yet.
                        </td>
                      </tr>
                    ) : (
                      artifacts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: "rgba(255,255,255,.08)",
                                border: "1px solid rgba(255,255,255,.12)",
                                color: "rgba(255,255,255,.85)",
                              }}
                            >
                              {a.type ?? "—"}
                            </span>
                          </td>
                          <td className="mono">{a.filename ?? "—"}</td>
                          <td className="text-secondary">{fmtTime(a.createdAt)}</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-light" onClick={() => onViewArtifact(a)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card bg-dark text-white border-0 mt-3" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="fw-semibold mb-2">Live status</div>
              <div className="text-secondary small">
                This page auto-checks QA results every few seconds after you click{" "}
                <span className="text-white">Run pipeline</span> or{" "}
                <span className="text-white">Refine &amp; Re-QA</span>. When QA becomes{" "}
                <span className="text-white">approved</span>, it will auto-reload.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* mono font helper */}
      <style jsx global>{`
        body {
          background: #0b1220;
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }
        .card {
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
}
