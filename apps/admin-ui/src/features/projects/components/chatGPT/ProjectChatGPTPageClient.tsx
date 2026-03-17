"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RegeneratePromptPackTab } from "./RegeneratePromptPackTab";
import { ScriptQATab } from "./ScriptQATab";
import { RefinePromptTab } from "./RefinePromptTab";
import { fetchJSON } from "@/lib/api/fetchJSON";
import { SegmentsGenerateTab } from "./SegmentsGenerateTab";
import { PromptPackPart } from "../../types";
/* =======================
   Component
======================= */

export function ProjectChatGPTPageClient({
  projectId,
}: {
  projectId: string;
}) {
  const [mainTab, setMainTab] = useState<
    "prompt_pack" | "regenerate" | "script_qa" | "script_refine" | "script_segments_generate"
  >("prompt_pack");

  const [parts, setParts] = useState<PromptPackPart[]>([]);
  const [jsonText, setJsonText] = useState("");
  const [promptSource, setPromptSource] = useState("");
  const [copied, setCopied] = useState(false);
  const [project, setProject] = useState({});

  const hasPromptPackData = parts.length > 0;
  const canRunScriptQA =
    parts.length > 0 &&
    parts.every((p) => p.content && p.content.trim());
  /* =======================
     Load prompt pack
  ======================= */

  async function loadPromptPack() {
    const p = await fetchJSON<any>(
      `/api/projects/${projectId}`
    );
    setProject(p);
    const partsData = p.prompt_pack_json?.parts ?? [];
    setParts(partsData);
    setJsonText(
      JSON.stringify(p.prompt_pack_json ?? {}, null, 2)
    );

    const res = await fetchJSON<{ ok: true; content: string }>(
      `/api/projects/${projectId}/prompts/content?step=prompt_generate_prompt_content`
    );
    setPromptSource(res.content || "");
  }

  async function savePromptPack() {
    await fetchJSON(`/api/projects/${projectId}/prompt-pack`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_pack_json: JSON.parse(jsonText) }),
    });
    loadPromptPack()
    alert("Prompt pack updated");
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(promptSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  useEffect(() => {
    loadPromptPack();
  }, [projectId]);

  /* =======================
     Render
  ======================= */

  return (
    <div className="container-fluid">
      <Link href={`/projects/${projectId}`}>
        ← Back to Project
      </Link>

      <h3 className="mt-2">ChatGPT Prompts</h3>

      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${mainTab === "prompt_pack"
              ? "btn-primary"
              : "btn-outline-primary"
            }`}
          onClick={() => setMainTab("prompt_pack")}
        >
          Prompt Pack
        </button>

        <button
          className={`btn btn-sm ${mainTab === "regenerate"
              ? "btn-primary"
              : "btn-outline-primary"
            }`}
          disabled={!hasPromptPackData}
          onClick={() => setMainTab("regenerate")}
        >
          Regenerate Prompt Pack
        </button>

        <button
          className={`btn btn-sm ${mainTab === "script_qa"
              ? "btn-primary"
              : "btn-outline-primary"
            }`}
          disabled={!canRunScriptQA}
          title={
            !canRunScriptQA
              ? "All parts must have content"
              : undefined
          }
          onClick={() => setMainTab("script_qa")}
        >
          Script QA
        </button>
        <button
          className={`btn btn-sm ${mainTab === "script_refine"
              ? "btn-primary"
              : "btn-outline-primary"
            }`}
          disabled={!hasPromptPackData}
          onClick={() => setMainTab("script_refine")}
        >
          Refine Content
        </button>
        
        <button
          className={`btn btn-sm ${mainTab === "script_segments_generate"
              ? "btn-primary"
              : "btn-outline-primary"
            }`}
          disabled={!hasPromptPackData}
          onClick={() => setMainTab("script_segments_generate")}
        >
          Segments Generate
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {mainTab === "prompt_pack" ? (
            <>
              <button
                className="btn btn-success me-2"
                onClick={savePromptPack}
              >
                Save Prompt Pack
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={copyPrompt}
              >
                {copied ? "✓ Copied" : "Copy Prompt"}
              </button>

              <textarea
                className="form-control mt-3 font-monospace"
                style={{ minHeight: 400 }}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />

              <pre className="p-2 border bg-dark text-light mt-3">
                {promptSource}
              </pre>
            </>
          ) : mainTab === "regenerate" ? (
            <RegeneratePromptPackTab
              project={project}
              projectId={projectId}
              parts={parts}
              onAction={loadPromptPack}
            />
          ) : mainTab === "script_qa" ? (
            <ScriptQATab
              projectId={projectId}
              project={project}
              onAction={loadPromptPack}
              parts={parts as any}
            />
          ) : mainTab === "script_refine" ? (
            <>
              <RefinePromptTab
              project={project}
              onAction={loadPromptPack}
            />
            </>
          ): mainTab === "script_segments_generate" ? (
            <>
              <SegmentsGenerateTab
              project={project}
              onAction={loadPromptPack}
            />
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}
