"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createProject, getProjects } from "./api";
import type { CreateProjectDto, ProjectDto } from "./types";
import { createSeries, getSeries } from "@/features/series/api";
import type { SeriesDto } from "@/features/series/types";
import { Button } from "react-bootstrap";
import { ModalFormProject } from "./components/projects/ModalFormProject";

type AlertState =
  | { variant: "info" | "success" | "warning" | "danger"; html: string }
  | null;

function escapeHtml(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" } as any)[m]
  );
}

function fmtTime(iso?: string) {
  try {
    return iso ? new Date(iso).toLocaleString() : "—";
  } catch {
    return iso || "—";
  }
}

function statusClass(status?: string) {
  const s = String(status || "").toUpperCase();
  if (s.includes("FAILED")) return "bg-danger";
  if (s.includes("QA") || s.includes("READY") || s.includes("PUBLISHED")) return "bg-success";
  if (s.includes("RENDER") || s.includes("FETCH") || s.includes("PLAN")) return "bg-info text-dark";
  if (s.includes("SCHEDULE")) return "bg-warning text-dark";
  return "badge-soft";
}


export function ProjectsPageClient({ channelId }: { channelId: string }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(true)
  const [project, setProject] = useState<ProjectDto>({
    id: '',
    topic: '',
    language: '',
    durationMinutes: 6,
    format: '',
    tone: '',
    pillar: '',
    seriesId: '',
    continuityMode: 'light'
  })
  // data
  const [allProjects, setAllProjects] = useState<ProjectDto[]>([]);
  const [allSeries, setAllSeries] = useState<SeriesDto[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // projects list controls
  const [projectSearch, setProjectSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    return [...allProjects]
      .filter((p) => !q || String(p.topic || "").toLowerCase().includes(q))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [allProjects, projectSearch]);

  function clearAlert() {
    setAlert(null);
  }

  function seriesNameById(id?: string) {
    if (!id) return "";
    const s = allSeries.find((x) => x.id === id);
    return s?.name || "";
  }


  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const ps = await getProjects(channelId);
      setAllProjects(ps);
    } catch (e) {
      setAlert({
        variant: "danger",
        html: `❌ Load projects failed: <span class="mono">${escapeHtml((e as any)?.message ?? e)}</span>`,
      });
      setAllProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }

  const handleClose = () => setOpen(false)

  // Boot
  useEffect(() => {
    (async () => {
      await loadProjects();
    })();
  }, []);
  function openModelChannel(id: string) {
    setOpen(true)
  }

  return (
    <div className="container-fluid py-4" >
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h4 mb-1">Admin</h1>
        </div>
        <div className="d-flex gap-2">
          <Button
            key={'create-project'}
            onClick={() => openModelChannel('')}
            aria-controls="example-collapse-text"
            aria-expanded={open}
            variant={"success"}
            className='text-start'
          >
            Create
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alert ? (
        <div className={`alert alert-${alert.variant} border-0 rounded-4 mb-3`} role="alert">
          <span dangerouslySetInnerHTML={{ __html: alert.html }} />
        </div>
      ) : null}
      <div className="card">
        <div className="card-header">
          <h1 className="text-white h4">
            {loadingProjects ? "Loading…" : `${filteredProjects.length} project(s)`}
          </h1>
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div></div>
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm bg-dark text-white "
                placeholder="Search topic…"
                style={{ width: 260 }}
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
              />
              <button className="btn btn-sm btn-outline-light" onClick={loadProjects}>
                Refresh
              </button>
            </div>
          </div>

          {/* Projects table */}
          <div className="card bg-dark text-white border-0 mt-4" >
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "46%" }}>Topic</th>
                      <th style={{ width: "18%" }}>Status</th>
                      <th style={{ width: "18%" }}>Series</th>
                      <th style={{ width: "18%" }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProjects ? (
                      <tr>
                        <td colSpan={4} className="text-secondary">
                          Loading…
                        </td>
                      </tr>
                    ) : filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-secondary">
                          No projects yet.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((p) => {
                        const seriesLabel = seriesNameById(p.seriesId) || (p.seriesId ? "Series" : "—");
                        return (
                          <tr key={p.id}>
                            <td>
                              <div className="fw-semibold">
                                <Link className="link-light" href={`/projects/${encodeURIComponent(p.id)}`}>
                                  {p.topic || "(no topic)"}
                                </Link>
                              </div>
                              <div className="text-secondary small mono">{p.id}</div>
                            </td>
                            <td>
                              <span className={`badge ${statusClass(p.status)}`}>{p.status || "—"}</span>
                            </td>
                            <td className="text-secondary">{seriesLabel}</td>
                            <td className="text-secondary">{fmtTime(p.createdAt)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalFormProject project={project} handleClose={handleClose} edit={edit} show={open} channelId={channelId} />
    </div>
  );
}
