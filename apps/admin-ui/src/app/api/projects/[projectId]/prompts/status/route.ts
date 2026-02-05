import { NextRequest } from "next/server";
import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function GET(req: NextRequest, props: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await props.params;
    return proxyToOrchestrator(`/projects/${projectId}/prompts/status`);
}
