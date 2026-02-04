"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createProject, getProjects } from "./api";
import type { CreateProjectDto, ProjectDto } from "./types";
import { createSeries, getSeries } from "@/features/series/api";
import type { SeriesDto } from "@/features/series/types";

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

// JSON template (giữ nguyên structure)
const SERIES_BIBLE_TEMPLATE = {
  core_theme: "Quiet resilience through honest self-reflection",
  promise: "I tell intimate stories that leave you with a surprising emotional shift.",
  voice: {
    pov: "first_person",
    tone: ["calm", "cinematic", "human", "emotionally honest"],
    avoid: ["generic self-help", "lecturing", "lists", "headings", "overly motivational clichés"],
  },
  cta_style: {
    channel_name: "Simple Mind Studio",
    greeting_rule: "One short greeting inside Part 1.",
    subscribe_rule: "After the hook ends, a natural and brief subscribe call-to-action.",
  },
  motifs: ["the blue door", "2am ceiling", "a folded note"],
  do_not: [
    "medical instructions",
    "legal advice",
    "hate/harassment",
    "illegal how-to",
    "graphic violence",
    "explicit sexual content",
  ],
};

export function ProjectsPageClient() {
  // tabs
  const [tab, setTab] = useState<"projects" | "series">("projects");

  // alerts
  const [alert, setAlert] = useState<AlertState>(null);

  // data
  const [allProjects, setAllProjects] = useState<ProjectDto[]>([]);
  const [allSeries, setAllSeries] = useState<SeriesDto[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);

  // project create form (default giống HTML)
  const [topic, setTopic] = useState("");
  const [pillar, setPillar] = useState("");
  const [seriesId, setSeriesId] = useState<string>("");
  const [continuityMode, setContinuityMode] = useState<CreateProjectDto["continuityMode"]>("light");
  const [language, setLanguage] = useState("en");
  const [durationMinutes, setDurationMinutes] = useState<number>(6);
  const [format, setFormat] = useState<string>("youtube_long");
  const [tone, setTone] = useState("");

  const [creatingProject, setCreatingProject] = useState(false);

  // projects list controls
  const [projectSearch, setProjectSearch] = useState("");

  // series create form
  const [seriesName, setSeriesName] = useState("");
  const [bibleJson, setBibleJson] = useState<string>(() => JSON.stringify(SERIES_BIBLE_TEMPLATE, null, 2));
  const [creatingSeries, setCreatingSeries] = useState(false);

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

  async function loadSeries() {
    setLoadingSeries(true);
    try {
      const s = await getSeries();
      setAllSeries(s);
    } catch (e) {
      setAlert({
        variant: "danger",
        html: `❌ Load series failed: <span class="mono">${escapeHtml((e as any)?.message ?? e)}</span>`,
      });
      setAllSeries([]);
    } finally {
      setLoadingSeries(false);
    }
  }

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const ps = await getProjects();
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

  async function onCreateProject() {
    const t = topic.trim();
    if (!t) {
      setAlert({ variant: "warning", html: `Please enter a <b>Topic</b>.` });
      return;
    }

    const body: CreateProjectDto = {
      topic: t,
      pillar: pillar.trim() || undefined,
      seriesId: seriesId.trim() || undefined,
      continuityMode: continuityMode || "light",
      language: language || "en",
      durationMinutes: durationMinutes || 6,
      format: format || "youtube_long",
      tone: tone.trim() || undefined,
    };

    setCreatingProject(true);
    clearAlert();

    try {
      const p: any = await createProject(body);
      const pid = p?.id || p?.project?.id;
      setAlert({ variant: "success", html: `✅ Project created. Opening…` });

      if (pid) {
        // route mới: /projects/[projectId]
        window.location.href = `/projects/${encodeURIComponent(pid)}`;
        return;
      }

      // fallback: refresh list
      await loadProjects();
    } catch (e) {
      setAlert({
        variant: "danger",
        html: `❌ Create project failed: <span class="mono">${escapeHtml((e as any)?.message ?? e)}</span>`,
      });
    } finally {
      setCreatingProject(false);
    }
  }

  async function onCreateSeries() {
    const name = seriesName.trim();
    if (!name) {
      setAlert({ variant: "warning", html: `Please enter a <b>Series name</b>.` });
      return;
    }

    let bible: any;
    try {
      bible = JSON.parse(bibleJson || "{}");
    } catch {
      setAlert({ variant: "danger", html: `Bible JSON is invalid. Please fix JSON syntax.` });
      return;
    }

    setCreatingSeries(true);
    clearAlert();

    try {
      const created: any = await createSeries({ name, bible });
      setAlert({ variant: "success", html: `✅ Series created.` });
      await loadSeries();

      // auto-select series in project form
      if (created?.id) setSeriesId(created.id);
      setSeriesName("");
    } catch (e) {
      setAlert({
        variant: "danger",
        html: `❌ Create series failed: <span class="mono">${escapeHtml((e as any)?.message ?? e)}</span>`,
      });
    } finally {
      setCreatingSeries(false);
    }
  }

  function onUseSeries(sid: string) {
    setSeriesId(sid);
    setTab("projects");
    setAlert({ variant: "success", html: `✅ Selected series for new project.` });
  }

  function onGoSeriesTab() {
    setTab("series");
    setTimeout(() => {
      const el = document.getElementById("seriesNameInput") as HTMLInputElement | null;
      el?.focus();
    }, 50);
  }

  // Boot
  useEffect(() => {
    // giống HTML: load series trước để dropdown có data, rồi load projects
    (async () => {
      await loadSeries();
      await loadProjects();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queuesHref = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_BULL_BOARD_BASE_URL ?? "";
    return base ? `${base.replace(/\/$/, "")}/queues` : "/queues";
  }, []);

  return (
    <div className="container py-4" style={{ maxWidth: 1150 }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h4 mb-1">Admin</h1>
          <div className="text-secondary">Projects, Series Bible &amp; continuity settings.</div>
        </div>
        <div className="d-flex gap-2">
          <a className="btn btn-outline-light" href={queuesHref} target="_blank" rel="noreferrer">
            Open Bull Queues
          </a>
        </div>
      </div>

      {/* Alerts */}
      {alert ? (
        <div className={`alert alert-${alert.variant} border-0 rounded-4 mb-3`} role="alert">
          <span dangerouslySetInnerHTML={{ __html: alert.html }} />
        </div>
      ) : null}

      {/* Tabs */}
      <ul className="nav nav-pills gap-2 mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === "projects" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("projects")}
          >
            Projects
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === "series" ? "" : ""} ${tab === "series" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("series")}
          >
            Series Bible
          </button>
        </li>
      </ul>

      {/* =========================
          TAB: PROJECTS
      ========================== */}
      {tab === "projects" ? (
        <div>
          {/* Create Project Panel */}
          <div className="card bg-dark text-white mb-3 border-0" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <div className="fw-semibold">New Project</div>
                  <div className="text-secondary small">
                    Create a project, then open it to run pipeline / refine / QA.
                  </div>
                </div>

                <button className="btn btn-success" onClick={onCreateProject} disabled={creatingProject}>
                  <span className="me-2">Create</span>
                  <span
                    className={`spinner-border spinner-border-sm ${creatingProject ? "" : "d-none"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <hr className="border-secondary border-opacity-25" />

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-secondary small">Topic (required)</label>
                  <input
                    className="form-control bg-black border-0 text-white"
                    placeholder="e.g., Why you feel stuck even when life looks fine"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small">Pillar / Angle</label>
                  <input
                    className="form-control bg-black border-0 text-white"
                    placeholder="e.g., calm psychological reframe"
                    value={pillar}
                    onChange={(e) => setPillar(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small">Series</label>
                  <div className="input-group">
                    <select
                      className="form-select bg-black border-0 text-white"
                      value={seriesId}
                      onChange={(e) => setSeriesId(e.target.value)}
                    >
                      <option value="">(none)</option>
                      {allSeries.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-outline-light" type="button" onClick={onGoSeriesTab}>
                      Create series
                    </button>
                  </div>
                  <div className="text-secondary small mt-1">
                    If set, scripts will follow Series Bible + memory for continuity.
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label text-secondary small">Continuity</label>
                  <select
                    className="form-select bg-black border-0 text-white"
                    value={continuityMode}
                    onChange={(e) => setContinuityMode(e.target.value as any)}
                  >
                    <option value="none">none</option>
                    <option value="light">light</option>
                    <option value="occasionally_strong">occasionally_strong</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label text-secondary small">Language</label>
                  <select
                    className="form-select bg-black border-0 text-white"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English (en)</option>
                    <option value="vi">Vietnamese (vi)</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label text-secondary small">Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className="form-control bg-black border-0 text-white"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small">Format</label>
                  <select
                    className="form-select bg-black border-0 text-white"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="youtube_long">youtube_long</option>
                    <option value="shorts">shorts</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small">Tone</label>
                  <input
                    className="form-control bg-black border-0 text-white"
                    placeholder="e.g., calm, grounded, mysterious"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* List controls */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div className="text-secondary small">
              {loadingProjects ? "Loading…" : `${filteredProjects.length} project(s)`}
            </div>
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm bg-dark text-white border-0"
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
          <div className="card bg-dark text-white border-0" style={{ borderRadius: 16 }}>
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
      ) : null}

      {/* =========================
          TAB: SERIES
      ========================== */}
      {tab === "series" ? (
        <div>
          {/* Create Series */}
          <div className="card bg-dark text-white mb-3 border-0" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <div className="fw-semibold">Create Series Bible</div>
                  <div className="text-secondary small">
                    Use the template, only change content. Keep JSON structure unchanged.
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-outline-light"
                    onClick={() => setBibleJson(JSON.stringify(SERIES_BIBLE_TEMPLATE, null, 2))}
                  >
                    Reset template
                  </button>
                  <button className="btn btn-primary" onClick={onCreateSeries} disabled={creatingSeries}>
                    <span className="me-2">Create series</span>
                    <span
                      className={`spinner-border spinner-border-sm ${creatingSeries ? "" : "d-none"}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              <hr className="border-secondary border-opacity-25" />

              <div className="row g-3">
                <div className="col-12 col-lg-5">
                  <label className="form-label text-secondary small">Series name (required)</label>
                  <input
                    id="seriesNameInput"
                    className="form-control bg-black border-0 text-white"
                    placeholder="e.g., Quiet Resilience Stories"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                  />
                  <div className="text-secondary small mt-2">
                    Tip: name should match a pillar (e.g., Anxiety Reframe / Quiet Discipline / Healing Shame).
                  </div>

                  <div className="card bg-black text-white mt-3 border-0">
                    <div className="card-body">
                      <div className="fw-semibold mb-2">What this does</div>
                      <ul className="text-secondary small mb-0">
                        <li>Locks tone/voice across videos.</li>
                        <li>Adds optional continuity (callbacks/open loops).</li>
                        <li>Helps avoid “AI compilation” feel.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-7">
                  <label className="form-label text-secondary small">Series Bible JSON (edit content only)</label>
                  <textarea
                    className="form-control bg-black border-0 text-white mono"
                    style={{ minHeight: 320 }}
                    value={bibleJson}
                    onChange={(e) => setBibleJson(e.target.value)}
                  />
                  <div className="text-secondary small mt-1">
                    Must be valid JSON. Keep keys/structure unchanged; edit text values only.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Series list */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="text-secondary small">
              {loadingSeries ? "Loading…" : `${allSeries.length} series`}
            </div>
            <button className="btn btn-sm btn-outline-light" onClick={loadSeries}>
              Refresh
            </button>
          </div>

          <div className="card bg-dark text-white border-0" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "38%" }}>Name</th>
                      <th style={{ width: "32%" }}>Core theme</th>
                      <th style={{ width: "20%" }}>Updated</th>
                      <th style={{ width: "10%" }} />
                    </tr>
                  </thead>

                  <tbody>
                    {loadingSeries ? (
                      <tr>
                        <td colSpan={4} className="text-secondary">
                          Loading…
                        </td>
                      </tr>
                    ) : allSeries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-secondary">
                          No series yet. Create one above.
                        </td>
                      </tr>
                    ) : (
                      allSeries.map((s) => {
                        const coreTheme = (s.bible && (s.bible as any).core_theme) || "—";
                        return (
                          <tr key={s.id}>
                            <td>
                              <div className="fw-semibold">{s.name || "—"}</div>
                              <div className="text-secondary small mono">{s.id}</div>
                            </td>
                            <td className="text-secondary">{String(coreTheme)}</td>
                            <td className="text-secondary">{fmtTime(s.updatedAt || s.createdAt)}</td>
                            <td className="text-end">
                              <button className="btn btn-sm btn-outline-light" onClick={() => onUseSeries(s.id)}>
                                Use
                              </button>
                            </td>
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
      ) : null}

      {/* styles to match html */}
      <style jsx global>{`
        body {
          background: #0b1220;
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }
        .badge-soft {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.85);
        }
      `}</style>
    </div>
  );
}
