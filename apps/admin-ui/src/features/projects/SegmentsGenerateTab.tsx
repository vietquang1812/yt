"use client";

import { useEffect, useState } from "react";
import { PromptPackPart } from './types'
import { fetchJSON } from "@/lib/api/fetchJSON";


/* =======================
   Component
======================= */

export function SegmentsGenerateTab({
  project,
  onAction
}: {
  project: any;
  onAction: Function;
}) {
  const [partPrompt, setPartPrompt] = useState("");
  const [partContent, setPartContent] = useState("");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [index, setIndex] = useState(1)
  const hasData = project.prompt_pack_json.parts.length > 0;

  /* =======================
     Effects
  ======================= */
    async function getPromptSegmentPart(part: number) {
        setIndex(part)
        try {
        const p = project.prompt_pack_json.parts.find((p: PromptPackPart) => p.part === part )

        const res = await fetchJSON<{ ok: true; content: string }>(
          `/api/projects/${project.id}/prompts/content?step=script_segments_generate&index=${p.part}`
        );
        setPartPrompt(res.content);

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
    }

  // load prompt when part changes
  useEffect(() => {
    (async () => {
      setLoadingPrompt(true);
      setError(null);
      getPromptSegmentPart(1)
    })();
  }, []);

  async function savePartContent() {

    await fetchJSON(
      `/api/projects/${project.id}/segments/parts/${index}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: partContent,
      }
    );
    onAction();
    alert(`Part ${index} content updated`);
    
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
        {project.prompt_pack_json.parts.map((p: PromptPackPart) => (
          <button
            key={p.part}
            className={`btn btn-sm ${p.part === index 
              ? "btn-primary"
              : "btn-outline-primary"
              }`}
            onClick={() => getPromptSegmentPart(p.part)}
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
