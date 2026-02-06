import { NextRequest } from "next/server";
import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function GET(req: NextRequest, props: { params: Promise<{ projectId: string }> }) {

    const { projectId } = await props.params;
    return proxyToOrchestrator(`/projects/${projectId}/all-script`);
}

export async function POST(req: NextRequest, props: { params: Promise<{ projectId: string }> }) {

    const {projectId }=  await props.params;
    const bodyText = await req.text();
    return proxyToOrchestrator(`/projects/${projectId}/all-script`, {
        method: "POST",
        bodyText,
        contentType: "application/json",
    });
}
