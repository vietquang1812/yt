import { NextRequest } from "next/server";
import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function GET(req: NextRequest, props: { params: Promise<{ projectId: string }> }) {

    const { projectId } = await props.params;
    return proxyToOrchestrator(`/projects/${projectId}/all-script`);
}

export async function PUT(req: NextRequest, { params }: { params: { projectId: string } }) {
    const bodyText = await req.text();
    return proxyToOrchestrator(`/projects/${params.projectId}/all-script`, {
        method: "PUT",
        bodyText,
        contentType: "application/json",
    });
}
