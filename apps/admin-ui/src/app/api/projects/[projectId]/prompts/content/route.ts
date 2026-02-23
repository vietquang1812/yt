import { NextRequest } from "next/server";
import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function GET(req: NextRequest,
    props: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await props.params;
    const step = req.nextUrl.searchParams.get("step") ?? "prompt_generate_prompt_content";
    const index = req.nextUrl.searchParams.get("index") ?? "";
    let url = `/projects/${projectId}/prompts/content?step=${encodeURIComponent(step)}`;
    if(index != ''){
        url += `&index=${index}`
    }
    return proxyToOrchestrator(url);
}
