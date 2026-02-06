"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* =======================
   Types
======================= */

type PromptStep =
  | "prompt_generate_prompt_content"
  | "regenerate_prompt_pack"
  | "script_qa"
  | "script_refine";

type PromptStatus = {
  step: PromptStep;
  exists: boolean;
  enabled: boolean;
  reason?: string | null;
};

type StatusResponse = {
  ok: true;
  status: Record<PromptStep, PromptStatus>;
};

type PromptPackPart = {
  part: number;
  role?: string;
  generation_prompt: string;
  content?: string;
  word_count?: number;
};

/* =======================
   Helpers
======================= */

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const text = await r.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch { }

  if (!r.ok) {
    const msg = data?.error || data?.message || `Request failed: ${r.status}`;
    throw new Error(msg);
  }

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
  const [status, setStatus] =
    useState<Record<PromptStep, PromptStatus> | null>(null);

  const [activeStep, setActiveStep] =
    useState<PromptStep>("prompt_generate_prompt_content");

  const [mainTab, setMainTab] =
    useState<"prompt_pack" | "regenerate_prompt_pack">("prompt_pack");

  const [content, setContent] = useState<string>(""); // qa / refine
  const [jsonText, setJsonText] = useState<string>(""); // prompt pack json
  const [promptSource, setPromptSource] = useState<string>(""); // source prompt
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // regenerate tab state
  const [parts, setParts] = useState<PromptPackPart[]>([]);
  const [activePart, setActivePart] = useState<number | null>(null);
  const [partContent, setPartContent] = useState("");
  const [copiedPartPrompt, setCopiedPartPrompt] = useState(false);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =======================
     Load status
  ======================= */

  async function loadStatus() {
    setLoadingStatus(true);
    setError(null);

    try {
      const res = await fetchJSON<StatusResponse>(
        `/api/projects/${projectId}/prompts/status`
      );
      setStatus(res.status);
    } catch (e: any) {
      setError(e?.message || "Failed to load prompt status");
    } finally {
      setLoadingStatus(false);
    }
  }

  /* =======================
     Load prompt pack + source
  ======================= */

  async function showPrompt(step: PromptStep) {
    setActiveStep(step);
    setMainTab("prompt_pack");
    setLoadingContent(true);
    setError(null);

    try {
      if (step === "prompt_generate_prompt_content") {
        const project = await fetchJSON<{
          ok: true;
          prompt_pack_json?: { parts?: PromptPackPart[] };
        }>(`/api/projects/${projectId}`);

        setJsonText(
          JSON.stringify(project.prompt_pack_json ?? {}, null, 2)
        );

        setParts(project.prompt_pack_json?.parts ?? []);
        setActivePart(project.prompt_pack_json?.parts?.[0]?.part ?? null);

        const promptRes = await fetchJSON<{ ok: true; content: string }>(
          `/api/projects/${projectId}/prompts/content?step=prompt_generate_prompt_content`
        );
        setPromptSource(promptRes.content || "");
        setContent("");
        return;
      }

      const res = await fetchJSON<{ ok: true; content: string }>(
        `/api/projects/${projectId}/prompts/content?step=${encodeURIComponent(
          step
        )}`
      );

      setContent(res.content || "");
      setJsonText("");
      setPromptSource("");
    } catch (e: any) {
      setError(e?.message || "Failed to load content");
    } finally {
      setLoadingContent(false);
    }
  }

  /* =======================
     Save prompt pack
  ======================= */

  async function savePromptPack() {
    try {
      const parsed = JSON.parse(jsonText);
      await fetchJSON(`/api/projects/${projectId}/prompt-pack`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_pack_json: parsed }),
      });
      alert("Prompt pack updated");
    } catch (e: any) {
      setError(e?.message || "Invalid JSON");
    }
  }

  async function copyPrompt(text: string, setter: any) {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1200);
  }

  /* =======================
     Regenerate tab helpers
  ======================= */

  const currentPart = parts.find((p) => p.part === activePart);

  useEffect(() => {
    setPartContent(currentPart?.content ?? "");
  }, [activePart]);

  async function savePartContent() {
    if (!currentPart) return;
    await fetchJSON(
      `/api/projects/${projectId}/prompt-pack/parts/${currentPart.part}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: partContent }),
      }
    );
    alert(`Part ${currentPart.part} content updated`);
  }

  /* =======================
     Init
  ======================= */

  useEffect(() => {
    (async () => {
      try {
        await fetch(
          `/api/projects/${projectId}/prompts/ensure?step=prompt_generate_prompt_content`,
          { method: "POST", cache: "no-store" }
        );
        await loadStatus();
        await showPrompt("prompt_generate_prompt_content");
      } catch (e: any) {
        setError(e?.message || "Initialization failed");
      }
    })();
  }, [projectId]);

  /* =======================
     Derived
  ======================= */

  const qa = status?.script_qa;
  const refine = status?.script_refine;

  /* =======================
     Render
  ======================= */

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between mb-3">
        <div>
          <Link className="link-secondary" href={`/projects/${projectId}`}>
            ← Back to Project
          </Link>
          <h3 className="mt-2 mb-0">ChatGPT Prompts</h3>
          <div className="text-secondary small">Project: {projectId}</div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Main Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${mainTab === "prompt_pack" ? "btn-primary" : "btn-outline-primary"
            }`}
          onClick={() => setMainTab("prompt_pack")}
        >
          Prompt Pack
        </button>
        <button
          className={`btn btn-sm ${mainTab === "regenerate_prompt_pack"
              ? "btn-primary"
              : "btn-outline-primary"
            }`}
          onClick={() => setMainTab("regenerate_prompt_pack")}
        >
          Regenerate Prompt Pack
        </button>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => showPrompt("script_qa")}
          disabled={!qa?.enabled}
        >
          script_qa
        </button>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => showPrompt("script_refine")}
          disabled={!refine?.enabled}
        >
          script_refine
        </button>
      </div>

      {/* CONTENT */}
      <div className="card">
        <div className="card-body">
          {loadingContent ? (
            <div>Loading…</div>
          ) : mainTab === "prompt_pack" ? (
            <>
              <div className="mb-3">
                <button
                  className="btn btn-sm btn-success me-2"
                  onClick={savePromptPack}
                >
                  Save Prompt Pack
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() =>
                    copyPrompt(promptSource, setCopiedPrompt)
                  }
                >
                  {copiedPrompt ? "✓ Copied" : "Copy Prompt"}
                </button>
              </div>
              <textarea
                className="form-control font-monospace"
                style={{ minHeight: 400 }}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              <pre className="p-2 border bg-dark text-light mb-3">
                {promptSource}
              </pre>


            </>
          ) : (
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

              {currentPart && (
                <>
                  <div className="mb-2 fw-bold">Generation Prompt</div>
                  <button
                    className="btn btn-sm btn-outline-secondary mb-2"
                    onClick={() =>
                      copyPrompt(
                        currentPart.generation_prompt,
                        setCopiedPartPrompt
                      )
                    }
                  >
                    {copiedPartPrompt ? "✓ Copied" : "Copy Prompt"}
                  </button>
                  <pre className="p-2 border bg-dark text-light mb-3">
                    {currentPart.generation_prompt}
                  </pre>

                  <div className="fw-bold mb-1">Generated Content</div>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 300 }}
                    value={partContent}
                    onChange={(e) => setPartContent(e.target.value)}
                  />

                  <button
                    className="btn btn-success mt-3"
                    onClick={savePartContent}
                  >
                    Save Content
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
