"use client";

import { fetchJSON } from "@/lib/api/fetchJSON";
import { useEffect, useState } from "react";

/* =======================
   Types
======================= */

type PromptPackPart = {
    part: number;
    content: string;
};


/* =======================
   Component
======================= */

export function ScriptQATab({
    projectId,
    project,
    parts,
    onAction
}: {
    projectId: string;
    project: any;
    parts: PromptPackPart[];
    onAction: Function;
}) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [qaContent, setQaContent] = useState("");

    /* =======================
       Load script_qa
    ======================= */

    useEffect(() => {
        (async () => {
            setQaContent(JSON.stringify(project?.qa_json, null, 2))

            setLoading(true);
            setError(null);

            try {
                // load prompt
                const promptRes = await fetchJSON<{ ok: true; content: string }>(
                    `/api/projects/${projectId}/prompts/content?step=script_qa`
                );
                setPrompt(promptRes.content || "");

                // init qa per part
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [projectId, parts]);

    async function saveScriptQA() {
        try {
            JSON.parse(qaContent)
        } catch (error) {
            setError('error JSON type')
            return
        }
        await fetchJSON(`/api/projects/${projectId}/artifacts/script_qa`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: qaContent,
        });
        onAction()
        alert("Script QA updated");
    }

    async function copyPrompt() {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }
    /* =======================
       Render
    ======================= */

    if (loading) return <div>Loading Script QA…</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <>
            <div className="mb-3">
                <button
                    className="btn btn-success me-2"
                    onClick={saveScriptQA}
                >
                    Save Script QA
                </button>
                <button
                    className="btn btn-outline-secondary "
                    onClick={copyPrompt}
                >
                    {copied ? "✓ Copied" : "Copy Prompt"}
                </button>
            </div>
            <div className="fw-bold mb-2">Script QA</div>
            <textarea
                className="form-control mt-2"
                style={{ minHeight: 300 }}
                value={qaContent}
                onChange={(e) => setQaContent(e.target.value)}
            />

            <div className="fw-bold mt-4">Script QA Prompt</div>
            <pre className="p-2 border bg-dark text-light mb-4">
                {prompt}
            </pre>



        </>
    );
}
