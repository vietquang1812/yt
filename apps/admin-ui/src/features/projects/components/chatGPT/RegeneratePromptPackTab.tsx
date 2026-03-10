"use client";

import { useEffect, useState } from "react";
import { PromptPackPart } from './types'
import { fetchJSON } from "@/lib/api/fetchJSON";


/* =======================
   Component
======================= */

export function RegeneratePromptPackTab({
  project,
  projectId,
  parts,
  onAction
}: {
  project: any;
  projectId: string;
  parts: PromptPackPart[];
  onAction: Function;
}) {
  const [activePart, setActivePart] = useState<number | null>(null);
  const [partPrompt, setPartPrompt] = useState("");
  const [partContent, setPartContent] = useState("");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const hasData = parts.length > 0;

  /* =======================
     Effects
  ======================= */

  // auto Part 1
  useEffect(() => {
    if (hasData) {
      setActivePart(parts[0].part);
    }
  }, [hasData, parts]);

  // load prompt when part changes
  useEffect(() => {
    if (activePart == null) return;

    (async () => {
      setLoadingPrompt(true);
      setError(null);
      try {
        const res = await fetchJSON<{ ok: true; prompt: string }>(
          `/api/projects/${projectId}/prompts/regenerate?part=${activePart}`
        );
        setPartPrompt(res.prompt);

        const p = parts.find((x) => x.part === activePart);
        const partJSON = {
          "part": p?.part,
          "role": p?.role,
          "word_count": p?.word_count,
          "content": p?.content,
        }
        setPartContent(JSON.stringify(partJSON, null, 2) ?? "");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingPrompt(false);
      }
    })();
  }, [activePart, projectId, parts]);

  async function savePartContent() {
    if (activePart == null) return;

    await fetchJSON(
      `/api/projects/${projectId}/prompt-pack/parts/${activePart}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: partContent,
      }
    );
    onAction();
    alert(`Part ${activePart} content updated`);
    
  }

  /* =======================
     Render
  ======================= */
  async function copy(text: string, setter: any) {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1200);
  }

  if (!hasData) {
    return (
      <div className="alert alert-warning">
        Prompt Pack chưa có dữ liệu
      </div>
    );
  }

  return (
    <>
      {/* Part tabs */}
      <div className="d-flex gap-2 mb-3">
        {parts.map((p) => (
          <button
            key={p.part}
            className={`btn btn-sm ${p.part === activePart
              ? "btn-primary"
              : "btn-outline-primary"
              }`}
            onClick={() => setActivePart(p.part)}
          >
            Part {p.part}
          </button>
        ))}
      </div>

      {loadingPrompt ? (
        <div>Loading prompt…</div>
      ) : (
        <>
          <div className="fw-bold mb-1">Generated Content</div>
          <button
            className="btn btn-success mt-3 me-2"
            onClick={savePartContent}
          >
            Save Content
          </button>
          <button
            className="btn  btn-outline-secondary  mt-3  "
            onClick={() => copy(partPrompt, setCopiedPrompt)}
          >
            {copiedPrompt ? "✓ Copied" : "Copy Prompt"}
          </button>

          <textarea
            className="form-control mt-2"
            style={{ minHeight: 300 }}
            value={partContent}
            onChange={(e) => setPartContent(e.target.value)}
          />


          <div className="fw-bold mt-4">Regenerate Prompt</div>

          <pre className="p-2 border bg-dark text-light mt-2">
            {partPrompt}
          </pre>


        </>
      )}

      {error && (
        <div className="alert alert-danger mt-3">{error}</div>
      )}
    </>
  );
}
