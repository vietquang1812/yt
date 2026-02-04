"use client";

import type { ArtifactDto } from "../types";
import { fmtTime } from "../lib/format";
import { badgeStyle } from "../lib/artifacts";

export function ArtifactsCard({
  artifacts,
  loading,
  lastUpdated,
  onViewArtifact,
}: {
  artifacts: ArtifactDto[];
  loading: boolean;
  lastUpdated: string;
  onViewArtifact: (a: ArtifactDto) => void;
}) {
  return (
    <div className="card bg-dark text-white border-0 mt-3" style={{ borderRadius: 16 }}>
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
                <tr><td colSpan={4} className="text-secondary">Loading…</td></tr>
              ) : artifacts.length === 0 ? (
                <tr><td colSpan={4} className="text-secondary">No artifacts yet.</td></tr>
              ) : (
                artifacts.map((a) => (
                  <tr key={a.id}>
                    <td><span className="badge" style={badgeStyle()}>{a.type ?? "—"}</span></td>
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
  );
}
