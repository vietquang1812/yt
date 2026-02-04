"use client";

import Link from "next/link";

export function ProjectHeader({
  queuesHref,
  onRun,
  onRefine,
  runBusy,
  refineBusy,
  loading,
  showRefine,
}: {
  queuesHref: string;
  onRun: () => void;
  onRefine: () => void;
  runBusy: boolean;
  refineBusy: boolean;
  loading: boolean;
  showRefine: boolean;
}) {
  return (
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
          <span className={`spinner-border spinner-border-sm ${runBusy ? "" : "d-none"}`} />
        </button>

        <button
          className={`btn btn-warning text-dark ${showRefine ? "" : "d-none"}`}
          onClick={onRefine}
          disabled={refineBusy || loading}
        >
          <span className="me-2">Refine &amp; Re-QA</span>
          <span className={`spinner-border spinner-border-sm ${refineBusy ? "" : "d-none"}`} />
        </button>
      </div>
    </div>
  );
}
