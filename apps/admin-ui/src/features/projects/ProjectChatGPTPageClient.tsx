"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RegeneratePromptPackTab } from "./RegeneratePromptPackTab";
import { ScriptQATab } from "./ScriptQATab";
import { PromptPackPart } from './types'

/* =======================
   Helpers
======================= */

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error(data?.message || "Request failed");
  return data as T;
}

/* =======================
   Component
======================= */

export function ProjectChatGPTPageClient({
  projectId,
}: {
  projectId: string;
}) {
  const [mainTab, setMainTab] = useState<
    "prompt_pack" | "regenerate" | "script_qa"
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
    console.log('project')
    const p = await fetchJSON<any>(
      `/api/projects/${projectId}`
    );
    console.log('project', p)
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
              projectId={projectId}
              parts={parts}
            />
          ) : (
            <ScriptQATab
              projectId={projectId}
              project={project}
              parts={parts as any}
            />
          )}
        </div>
      </div>
    </div>
  );
}
