"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PromptStep = "metadata_generate" | "script_qa" | "script_refine";

type PromptStatus = {
  step: PromptStep;
  exists: boolean;          // prompt file exists?
  enabled: boolean;         // button enabled?
  reason?: string | null;   // why disabled
};

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

function parsePrompt(text: string) {
  const raw = text || "";
  const systemMatch = raw.match(/(?:^|\n)\s*system\s*\n([\s\S]*?)(?:\n\s*user\s*\n)/i);
  const userMatch = raw.match(/(?:^|\n)\s*user\s*\n([\s\S]*)$/i);

  return {
    system: (systemMatch?.[1] ?? "").trim(),
    user: (userMatch?.[1] ?? "").trim(),
    raw,
  };
}

export function ProjectChatGPTPageClient({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<Record<PromptStep, PromptStatus> | null>(null);

  const [activeStep, setActiveStep] = useState<PromptStep>("metadata_generate");
  const [content, setContent] = useState<string>("");

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadStatus() {
    setLoadingStatus(true);
    setError(null);
    try {
      const res = await fetchJSON<{ ok: true; status: Record<PromptStep, PromptStatus> }>(
        `/api/projects/${projectId}/prompts/status`
      );
      setStatus(res.status);
    } catch (e: any) {
      setError(e?.message || "Failed to load prompt status");
    } finally {
      setLoadingStatus(false);
    }
  }
  async function handleCopy() {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);

      // reset flag sau 1.5s
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setError("Failed to copy to clipboard");
    }
  }

  async function showPrompt(step: PromptStep) {
    setActiveStep(step);
    setLoadingContent(true);
    setError(null);
    try {
      const res = await fetchJSON<{ ok: true; content: string }>(
        `/api/projects/${projectId}/prompts/content?step=${encodeURIComponent(step)}`
      );
      setContent(res.content || "");
    } catch (e: any) {
      setError(e?.message || "Failed to load prompt content");
      setContent("");
    } finally {
      setLoadingContent(false);
    }
  }

  async function ensureAndShowScriptQA() {
    // 1) ensure (server checks prerequisites + create file if missing)
    setError(null);
    setLoadingContent(true);
    try {
      const ensured = await fetchJSON<{
        ok: boolean;
        enabled: boolean;
        reason?: string | null;
        created?: boolean;
      }>(`/api/projects/${projectId}/prompts/ensure?step=script_qa`, { method: "POST" });

      // refresh status UI
      await loadStatus();

      if (!ensured.enabled) {
        // keep current content, just show reason
        setError(ensured.reason || "script_qa is not available yet");
        return;
      }

      // 2) show content
      await showPrompt("script_qa");
    } catch (e: any) {
      setError(e?.message || "Failed to ensure script_qa prompt");
    } finally {
      setLoadingContent(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoadingStatus(true);
        setError(null);

        // 1) PREVIEW / ENSURE metadata_generate prompt exists
        // (server sẽ tạo file metadata_generate.txt nếu chưa có)
        await fetch(`/api/projects/${projectId}/prompts/ensure?step=metadata_generate`, {
          method: "POST",
          cache: "no-store",
        });

        // 2) refresh status
        await loadStatus();

        // 3) auto-show metadata prompt right away
        await showPrompt("metadata_generate");
      } catch (e: any) {
        setError(e?.message || "Failed to preview metadata_generate");
      } finally {
        setLoadingStatus(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);


  const parsed = useMemo(() => parsePrompt(content), [content]);

  const meta = status?.metadata_generate;
  const qa = status?.script_qa;
  const refine = status?.script_refine;
  const refineDisabled = loadingStatus || !(refine?.enabled);
  const metaDisabled = loadingStatus || !(meta?.enabled);
  const qaDisabled = loadingStatus || !(qa?.enabled);

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <Link className="link-secondary" href={`/projects/${projectId}`}>
            ← Back to Project
          </Link>
          <h3 className="mt-2 mb-0">ChatGPT Prompts (Preview)</h3>
          <div className="text-secondary small">Project: {projectId}</div>
        </div>

        <button className="btn btn-sm btn-outline-secondary" onClick={loadStatus} disabled={loadingStatus}>
          Refresh
        </button>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeStep === "metadata_generate" ? "btn-primary" : "btn-outline-primary"}`}
          disabled={metaDisabled}
          onClick={() => showPrompt("metadata_generate")}
          title={meta?.reason || ""}
        >
          1) metadata_generate
          {loadingStatus ? "" : meta?.exists ? " ✅" : " ⏳"}
        </button>

        <button
          className={`btn btn-sm ${activeStep === "script_qa" ? "btn-primary" : "btn-outline-primary"}`}
          disabled={qaDisabled}
          onClick={() => {
            // nếu file đã có thì show, chưa có thì ensure + show
            if (qa?.exists) showPrompt("script_qa");
            else ensureAndShowScriptQA();
          }}
          title={qa?.reason || ""}
        >
          2) script_qa
          {loadingStatus ? "" : qa?.exists ? " ✅" : qa?.enabled ? " ⏳" : " 🔒"}
        </button>

        <button
          className={`btn btn-sm ${activeStep === "script_refine" ? "btn-primary" : "btn-outline-primary"}`}
          disabled={refineDisabled}
          onClick={() => {
            if (refine?.exists) showPrompt("script_refine");
            else fetchJSON(`/api/projects/${projectId}/prompts/ensure?step=script_refine`, { method: "POST" })
              .then(loadStatus)
              .then(() => showPrompt("script_refine"))
              .catch((e: any) => setError(e?.message || "Failed to ensure script_refine"));
          }}
          title={refine?.reason || ""}
        >
          3) script_refine
          {loadingStatus ? "" : refine?.exists ? " ✅" : refine?.enabled ? " ⏳" : " 🔒"}
        </button>

      </div>

      {qa?.enabled === false && qa?.reason ? (
        <div className="alert alert-warning py-2">
          <b>script_qa</b> is disabled: {qa.reason}
        </div>
      ) : null}

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <div className="fw-bold">Prompt content</div>
          <button
            className={`btn btn-sm ${copied ? "btn-success" : "btn-outline-secondary"}`}
            onClick={handleCopy}
            disabled={!content}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <div className="card-body">
          {loadingContent ? (
            <div className="text-secondary">Loading…</div>
          ) : !content ? (
            <div className="text-secondary">Click a button to load the prompt.</div>
          ) : (
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              {parsed.system ? (
                <>
                  <div className="fw-bold">system</div>
                  <pre className="p-2 border rounded bg-dark" style={{ whiteSpace: "pre-wrap" }}>
                    {parsed.system}
                  </pre>
                </>
              ) : null}

              {parsed.user ? (
                <>
                  <div className="fw-bold mt-3">user</div>
                  <pre className="p-2 border rounded bg-dark" style={{ whiteSpace: "pre-wrap" }}>
                    {parsed.user}
                  </pre>
                </>
              ) : (
                <>
                  <div className="fw-bold">raw</div>
                  <pre className="p-2 border rounded bg-dark" style={{ whiteSpace: "pre-wrap" }}>
                    {parsed.raw}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
