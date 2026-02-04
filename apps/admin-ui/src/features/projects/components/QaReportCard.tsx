"use client";

import type { QaReportWithMeta } from "../types";

export function QaReportCard({ qa }: { qa: QaReportWithMeta | null }) {
  if (!qa) return null;
  const approved = qa.approved === true;
  const failed = qa.approved === false;

  return (
    <div className="card bg-dark text-white border-0 mt-3" style={{ borderRadius: 16 }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="fw-semibold">QA Report</div>
            <div className="text-secondary small mt-1">{qa.summary ?? "—"}</div>
          </div>
          <span className={`badge ${approved ? "bg-success" : failed ? "bg-danger" : "bg-secondary"}`}>
            {approved ? "APPROVED" : failed ? "FAILED" : "UNKNOWN"}
          </span>
        </div>

        <hr className="border-secondary border-opacity-25" />

        <div className="text-secondary small mb-2">Issues</div>
        <pre className="mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(qa.issues ?? [], null, 2)}
        </pre>
      </div>
    </div>
  );
}
