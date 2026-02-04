"use client";

import type { SegmentLike } from "../lib/types";
import { getSegmentId, pickNarration, pickTitle } from "../lib/types";
import { badgeStyle } from "../lib/artifacts";
import { copyToClipboard } from "../lib/clipboard";
import type { StatusAlert } from "../lib/types";

export function ScenesPromptsCard({
  segments,
  scenePlan,
  setStatusAlert,
}: {
  segments: SegmentLike[] | null;
  scenePlan: any[] | null;
  setStatusAlert: (a: StatusAlert) => void;
}) {
  const segs = segments && segments.length ? segments : [];
  const sourceLabel =
    segs.length ? `From SCRIPT_SEGMENTS_JSON (${segs.length})` :
    scenePlan?.length ? `From SCENE_PLAN_JSON (${scenePlan.length})` :
    "—";

  return (
    <div className="card bg-dark text-white border-0" style={{ borderRadius: 16 }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fw-semibold">Scenes & Prompts</div>
          <div className="text-secondary small">{sourceLabel}</div>
        </div>

        {segs.length ? (
          <div className="accordion accordion-flush" id="segmentsAccordion">
            {segs.map((seg, i) => {
              const sid = getSegmentId(seg, i);
              const headerId = `segHead_${sid}`;
              const collapseId = `segCol_${sid}`;
              const title = pickTitle(seg, i);
              const narration = pickNarration(seg);
              const img = String(seg?.image_prompt ?? "");
              const vid = String(seg?.video_prompt ?? "");
              const neg = String(seg?.negative_prompt ?? "");

              async function copy(kind: string, text: string) {
                if (!text) return;
                const ok = await copyToClipboard(text);
                setStatusAlert({
                  variant: ok ? "success" : "danger",
                  html: ok ? `✅ Copied ${kind}.` : `❌ Copy failed.`,
                });
              }

              return (
                <div
                  className="accordion-item bg-dark text-white border-top border-secondary border-opacity-25"
                  key={sid}
                >
                  <h2 className="accordion-header" id={headerId}>
                    <button
                      className="accordion-button collapsed bg-dark text-white"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#${collapseId}`}
                      aria-expanded="false"
                      aria-controls={collapseId}
                      style={{ boxShadow: "none" }}
                    >
                      <div className="d-flex align-items-center gap-2 w-100">
                        <span className="badge" style={badgeStyle()}>
                          #{i + 1}
                        </span>
                        <span className="fw-semibold">{title}</span>
                        <span className="ms-auto text-secondary small">
                          {seg?.start != null || seg?.end != null ? `${seg?.start ?? "?"} → ${seg?.end ?? "?"}` : ""}
                        </span>
                      </div>
                    </button>
                  </h2>

                  <div
                    id={collapseId}
                    className="accordion-collapse collapse"
                    aria-labelledby={headerId}
                    data-bs-parent="#segmentsAccordion"
                  >
                    <div className="accordion-body pt-2">
                      <Row label="Narration" text={narration} onCopy={() => copy("narration", narration)} />
                      <Row label="Image prompt" text={img} onCopy={() => copy("image prompt", img)} />
                      <Row label="Video prompt" text={vid} onCopy={() => copy("video prompt", vid)} />
                      <Row label="Negative prompt" text={neg} onCopy={() => copy("negative prompt", neg)} />

                      {(seg?.style || seg?.background || seg?.emotion || seg?.visual_notes) ? (
                        <>
                          <hr className="border-secondary border-opacity-25" />
                          <div className="row g-2">
                            {seg?.style ? <Meta k="Style" v={String(seg.style)} /> : null}
                            {seg?.background ? <Meta k="Background" v={String(seg.background)} /> : null}
                            {seg?.emotion ? <Meta k="Emotion" v={String(seg.emotion)} /> : null}
                            {seg?.visual_notes ? <Meta k="Visual notes" v={String(seg.visual_notes)} /> : null}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : scenePlan?.length ? (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>#</th>
                  <th>Scene</th>
                </tr>
              </thead>
              <tbody>
                {scenePlan.map((s, i) => (
                  <tr key={i}>
                    <td><span className="badge" style={badgeStyle()}>{i + 1}</span></td>
                    <td className="mono" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {typeof s === "string" ? s : JSON.stringify(s, null, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-secondary small">
            No segments yet. Run pipeline to generate <span className="text-white">SCRIPT_SEGMENTS_JSON</span>.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, text, onCopy }: { label: string; text: string; onCopy: () => void }) {
  const disabled = !text;
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div className="text-secondary small">{label}</div>
        <button className="btn btn-sm btn-outline-light" onClick={onCopy} disabled={disabled}>
          Copy
        </button>
      </div>
      <pre className="mono mb-3" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {text || "—"}
      </pre>
    </>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="col-12">
      <div className="text-secondary small">{k}</div>
      <div className="mono">{v}</div>
    </div>
  );
}
