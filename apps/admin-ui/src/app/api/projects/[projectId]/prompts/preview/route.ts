import { NextRequest } from "next/server";
import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await props.params;
    const step = req.nextUrl.searchParams.get("step") ?? "metadata_generate";

    return proxyToOrchestrator(
        `/projects/${projectId}/prompts/preview?step=${encodeURIComponent(step)}`,
        { method: "POST" }
    );
}
