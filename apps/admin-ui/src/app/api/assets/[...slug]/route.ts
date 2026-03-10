import { NextRequest } from "next/server";
import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";
const BASE = (process.env.ORCH_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function GET(req: NextRequest,
    props: { params: Promise<{ slug: string[] }>; }
) {
    
    const { slug } = await props.params;
    const path = '/assets/' + slug.join('/')
        const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    return await fetch(url,)
    // return proxyToOrchestrator(`/assets/${path}`);
}
