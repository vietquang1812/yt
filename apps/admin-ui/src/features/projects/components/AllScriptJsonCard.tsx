"use client";

import { useEffect, useState } from "react";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const text = await r.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!r.ok) {
    const msg = data?.error || data?.message || `Request failed: ${r.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export function AllScriptJsonCard({ projectId }: { projectId: string }) {
  const [text, setText] = useState<string>("{}");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);



  async function save() {
    setSaving(true);
    setError(null);
    setSavedFlag(false);

    try {
      // validate JSON in UI first
      const parsed = JSON.parse(text);

      await fetchJSON(`/api/projects/${projectId}/all-script`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed),
      });

      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to save all_script");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between">
        <div className="fw-bold">all_script_json</div>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${savedFlag ? "btn-success" : "btn-primary"}`}
            onClick={save}
            disabled={loading || saving}
          >
            {savedFlag ? "✓ Saved" : saving ? "Saving…" : "Save JSON"}
          </button>
        </div>
      </div>

      <div className="card-body">
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        {loading ? (
          <div className="text-secondary">Loading…</div>
        ) : (
          <textarea
            className="form-control"
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
          />
        )}
      </div>
    </div>
  );
}
