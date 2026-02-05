"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSeries, getSeries } from "./api";
import type { SeriesDto } from "./types";

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
};

function fmtTime(iso?: string) {
  try {
    return iso ? new Date(iso).toLocaleString() : "—";
  } catch {
    return iso || "—";
  }
}

export function SeriesPageClient() {
  const [items, setItems] = useState<SeriesDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [bibleText, setBibleText] = useState(JSON.stringify(SERIES_BIBLE_TEMPLATE, null, 2));
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await getSeries());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const canCreate = useMemo(() => name.trim().length >= 2, [name]);

  async function onCreate() {
    setErr(null);
    setOk(null);
    let bible: any;
    try {
      bible = JSON.parse(bibleText);
    } catch (e: any) {
      setErr("Bible JSON không hợp lệ. Hãy kiểm tra dấu phẩy/ngoặc.");
      return;
    }
    try {
      await createSeries({ name: name.trim(), bible });
      setOk("Đã tạo series ✅");
      setName("");
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">Series</h2>
        <button className="btn btn-outline-light" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </div>

      {err ? <div className="alert alert-danger">{err}</div> : null}
      {ok ? <div className="alert alert-success">{ok}</div> : null}

      <div className="card bg-dark text-white border-secondary mb-4">
        <div className="card-body">
          <h5 className="card-title">Create Series</h5>

          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <label className="form-label">Name</label>
              <input
                className="form-control bg-black text-white border-secondary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Simple Mind Studio - Season 1"
              />
            </div>

            <div className="col-12 col-lg-8">
              <label className="form-label">Bible (JSON)</label>
              <textarea
                className="form-control bg-black text-white border-secondary mono"
                rows={10}
                value={bibleText}
                onChange={(e) => setBibleText(e.target.value)}
              />
            </div>

            <div className="col-12">
              <button className="btn btn-primary" disabled={!canCreate} onClick={onCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-dark text-white border-secondary">
        <div className="card-body">
          <h5 className="card-title">All Series</h5>

          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="text-secondary">Core theme</th>
                  <th className="text-secondary">Status</th>
                  <th className="text-secondary">Updated</th>
                  <th className="text-end">Open</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-secondary">Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="text-secondary">No series yet.</td></tr>
                ) : (
                  items.map((s) => {
                    const core = (s.bible as any)?.core_theme ?? "—";
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="fw-semibold">{s.name || "—"}</div>
                          <div className="text-secondary small mono">{s.id}</div>
                        </td>
                        <td className="text-secondary">{String(core)}</td>
                        <td>{ s.disabled ? <span className="badge bg-secondary">Disabled</span> : <span className="badge bg-success">Active</span> }</td>
                        <td className="text-secondary">{fmtTime(s.updatedAt || s.createdAt)}</td>
                        <td className="text-end">
                          <Link className="btn btn-sm btn-outline-light" href={`/series/${s.id}`}>
                            Manage
                          </Link>
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

      <style jsx global>{`
        body { background: #0b1220; }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }
      `}</style>
    </div>
  );
}
