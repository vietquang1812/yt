import { NextRequest } from "next/server";
import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function GET(req: NextRequest,
    props: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await props.params;
    const part = req.nextUrl.searchParams.get("part") ?? "1";
    return proxyToOrchestrator(`/projects/${projectId}/prompts/regenerate?part=${encodeURIComponent(part)}`);
}
