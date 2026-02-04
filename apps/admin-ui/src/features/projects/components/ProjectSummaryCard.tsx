"use client";

import type { ArtifactDto, ProjectDto } from "../types";
import { badgeStyle, latestByType } from "../lib/artifacts";

export function ProjectSummaryCard({
  project,
  projectId,
  artifacts,
  statusDraft,
  setStatusDraft,
  statusBusy,
  onSaveStatus,
  loading,
}: {
  project: ProjectDto | null;
  projectId: string;
  artifacts: ArtifactDto[];
  statusDraft: string;
  setStatusDraft: (v: string) => void;
  statusBusy: boolean;
  onSaveStatus: () => void;
  loading: boolean;
}) {
  const scriptArt = latestByType(artifacts, "SCRIPT_FINAL_MD");
  const metaArt = latestByType(artifacts, "METADATA_JSON");
  const qaArt = latestByType(artifacts, "QA_REPORT_JSON");

  const base = process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? "";

  return (
    <div className="card bg-dark text-white border-0" style={{ borderRadius: 16 }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div className="text-secondary small">Project ID</div>
            <div className="mono">{project?.id ?? projectId}</div>
          </div>
          <span className="badge" style={badgeStyle()}>
            {project?.status ?? "—"}
          </span>
        </div>

        <div className="mt-3 d-flex gap-2 align-items-center flex-wrap">
          <div className="text-secondary small me-2">Set status:</div>
          <select
            className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-25"
            style={{ width: 240 }}
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            disabled={loading || statusBusy}
          >
            <option value="">— Select —</option>
            <option value="IDEA_SELECTED">💡 Ý tưởng</option>
            <option value="SCENES_PLANNED">🛠️ Đang thực hiện video</option>
            <option value="VIDEO_RENDERED">✅ Đã hoàn thành</option>
            <option value="PUBLISHED">🚀 Đã public lên YT</option>
          </select>

          <button
            className="btn btn-outline-light btn-sm"
            onClick={onSaveStatus}
            disabled={loading || statusBusy || !statusDraft}
          >
            <span className="me-2">Update</span>
            <span className={`spinner-border spinner-border-sm ${statusBusy ? "" : "d-none"}`} />
          </button>
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
            <a className="btn btn-outline-light" href={`${base}/admin/api/projects/${projectId}/artifacts/${scriptArt.id}/content`} target="_blank" rel="noreferrer">
              Open script_final.md
            </a>
          ) : null}
          {metaArt ? (
            <a className="btn btn-outline-light" href={`${base}/admin/api/projects/${projectId}/artifacts/${metaArt.id}/content`} target="_blank" rel="noreferrer">
              Open metadata.json
            </a>
          ) : null}
          {qaArt ? (
            <a className="btn btn-outline-light" href={`${base}/admin/api/projects/${projectId}/artifacts/${qaArt.id}/content`} target="_blank" rel="noreferrer">
              Open qa_report.json
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
