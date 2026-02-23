import { fetchJSON } from "@/lib/api/fetchJSON";
import { useEffect, useState } from "react";
import { PromptPackPart } from "./types";

export function RefinePromptTab({
    project
}: {
    project: any;
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
        try {
            const data = JSON.parse(partContent)
            if (data.parts.length === 0) setError('missing Parts')
            if (data.parts.length > project.parts.length) {
                const parts = data.parts.map((p: PromptPackPart , index: number)=> {
                    p.generation_prompt = project.parts[index].generation_prompt || ''
                    return p;
                })
            } else {
            }

        } catch (error) {
            setError('Error JSON Type')
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

