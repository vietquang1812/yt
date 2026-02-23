import { fetchJSON } from "@/lib/api/fetchJSON";
import { useEffect, useState } from "react";
import { PromptPackPart } from "./types";

export function RefinePromptTab({
    project,
    onAction
}: {
    project: any;
    onAction: Function;
}) {
    const [loading, setLoading] = useState(false);
    const [partPrompt, setPartPrompt] = useState("");
    const [partContent, setPartContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        (async () => {
            setPartContent(JSON.stringify(project.prompt_pack_json, null, 2))
            setLoading(true);
            setError(null);

            try {
                // load prompt
                const res = await fetchJSON<{ ok: true; content: string; }>(
                    `/api/projects/${project.id}/prompts/content?step=script_refine`
                );
                setPartPrompt(res.content || "")
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [project]);


    async function saveScriptRefine() {
        let parts: any
        const projectParts = project.prompt_pack_json.parts
        try {
            const data = JSON.parse(partContent.trim())
            if (data.parts.length === 0) setError('missing Parts')
            if (data.parts.length > project.prompt_pack_json.parts.length) {
                parts = data.parts.map((p: PromptPackPart, index: number) => {
                    const part = { ...p, generation_prompt: projectParts[index]?.generation_prompt ?? '' }
                    return part;
                })

            } else {
                parts = data.parts.map((p: PromptPackPart, index: number) => {
                    const part = { ...p, generation_prompt: projectParts[index]?.generation_prompt ?? '' }
                    return part;
                })
            }
            console.log(parts)
            project.prompt_pack_json.parts = parts

            await fetchJSON(`/api/projects/${project.id}/prompt-pack`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt_pack_json: project.prompt_pack_json }),
            });

            onAction()
            alert("Prompt pack updated");
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(String(error)); // Handle cases where something else was thrown
            }
        }
    }
    async function copyPrompt() {
        await navigator.clipboard.writeText(partPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }

    if (loading) return <div>Loading Script Refine…</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <>
            <div className="gap-2 mb-3">
                <div className="mb-3">
                    <button
                        className="btn btn-success me-2"
                        onClick={saveScriptRefine}
                    >
                        Save Script Refine
                    </button>
                    <button
                        className="btn btn-outline-secondary "
                        onClick={copyPrompt}
                    >
                        {copied ? "✓ Copied" : "Copy Prompt"}
                    </button>
                </div>

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
            </div>
        </>
    )
}

