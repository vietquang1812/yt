import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function GET() {
    return proxyToOrchestrator("/channels");
}

export async function POST(req: Request) {
    const bodyText = await req.text();
    return proxyToOrchestrator("/channels", {
        method: "POST",
        bodyText,
        contentType: "application/json",
    });
}
