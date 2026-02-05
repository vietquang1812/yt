"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSeriesById, updateSeries } from "./api";
import type { SeriesDto } from "./types";

export function SeriesDetailClient({ seriesId }: { seriesId: string }) {
  const [data, setData] = useState<SeriesDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [bibleText, setBibleText] = useState("{}");

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    if (!data) return false;
    const originalName = data.name ?? "";
    const originalDisabled = !!data.disabled;
    const originalBible = JSON.stringify(data.bible ?? {}, null, 2);
    return (
      name !== originalName ||
      disabled !== originalDisabled ||
      bibleText.trim() !== originalBible.trim()
    );
  }, [data, name, disabled, bibleText]);

  async function refresh() {
    setLoading(true);
    setErr(null);
    setOk(null);

    try {
      const s = await getSeriesById(seriesId);
      setData(s);
      setName(s.name ?? "");
      setDisabled(!!s.disabled);
      setBibleText(JSON.stringify(s.bible ?? {}, null, 2));
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  async function onSave() {
    setErr(null);
    setOk(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErr("Name phải có ít nhất 2 ký tự.");
      return;
    }

    let bible: any;
    try {
      bible = JSON.parse(bibleText);
    } catch {
      setErr("Bible JSON không hợp lệ.");
      return;
    }

    try {
      const updated = await updateSeries(seriesId, {
        name: trimmedName,
        bible,
        disabled,
      });
      setData(updated);
      setOk("Đã lưu ✅");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  function onReset() {
    if (!data) return;
    setName(data.name ?? "");
    setDisabled(!!data.disabled);
    setBibleText(JSON.stringify(data.bible ?? {}, null, 2));
    setErr(null);
    setOk(null);
  }

  const memoryPretty = useMemo(() => {
    const m = (data as any)?.memory?.memory ?? null;
    return m ? JSON.stringify(m, null, 2) : "";
  }, [data]);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="text-secondary small">
            <Link className="text-decoration-none" href="/series">
              ← Back to Series
            </Link>
          </div>

          <div className="d-flex align-items-center gap-2">
            <h2 className="m-0">Manage Series</h2>
            {data ? (
              data.disabled ? (
                <span className="badge bg-secondary">Disabled</span>
              ) : (
                <span className="badge bg-success">Active</span>
              )
            ) : null}
          </div>

          <div className="text-secondary small mono">{seriesId}</div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-light"
            onClick={refresh}
            disabled={loading}
          >
            Refresh
          </button>

          <button
            className="btn btn-outline-warning"
            onClick={onReset}
            disabled={loading || !data || !isDirty}
            title="Reset về trạng thái đang lưu"
          >
            Reset
          </button>

          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={loading || !data || !isDirty}
          >
            Save
          </button>
        </div>
      </div>

      {err ? <div className="alert alert-danger">{err}</div> : null}
      {ok ? <div className="alert alert-success">{ok}</div> : null}

      {loading ? (
        <div className="text-secondary">Loading…</div>
      ) : !data ? (
        <div className="text-secondary">Not found.</div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-lg-5">
            <div className="card bg-dark text-white border-secondary">
              <div className="card-body">
                <h5 className="card-title">Basics</h5>

                <label className="form-label">Name</label>
                <input
                  className="form-control bg-black text-white border-secondary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className="form-check form-switch mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={disabled}
                    onChange={(e) => setDisabled(e.target.checked)}
                    id="seriesDisabled"
                  />
                  <label className="form-check-label" htmlFor="seriesDisabled">
                    Disable this series (không dùng cho project mới)
                  </label>
                </div>

                <div className="mt-3 text-secondary small">
                  Updated: {(data.updatedAt || data.createdAt) ?? "—"}
                </div>

                {disabled ? (
                  <div className="alert alert-warning mt-3 mb-0">
                    Series đang <b>Disabled</b>. Các project tạo mới sẽ bị chặn nếu chọn series này.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="card bg-dark text-white border-secondary mt-3">
              <div className="card-body">
                <h5 className="card-title">Series Memory (read-only)</h5>
                <textarea
                  className="form-control bg-black text-white border-secondary mono"
                  rows={10}
                  value={memoryPretty || "—"}
                  readOnly
                />
                <div className="text-secondary small mt-2">
                  (Memory hiện được worker cập nhật ở flow refine; để read-only cho an toàn.)
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card bg-dark text-white border-secondary">
              <div className="card-body">
                <h5 className="card-title">Series Bible (JSON)</h5>
                <textarea
                  className="form-control bg-black text-white border-secondary mono"
                  rows={22}
                  value={bibleText}
                  onChange={(e) => setBibleText(e.target.value)}
                />
                <div className="text-secondary small mt-2">
                  Tip: Nếu JSON invalid thì Save sẽ báo lỗi; hãy kiểm tra dấu phẩy/ngoặc.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        body {
          background: #0b1220;
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }
      `}</style>
    </div>
  );
}
