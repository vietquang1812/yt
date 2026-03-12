import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function POST(req: Request) {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();

        return proxyToOrchestrator("/channels/upload", {
            method: "POST",
            body: formData,
            contentType: contentType, 
        });
    }

    const bodyText = await req.text();
    return proxyToOrchestrator("/channels/upload", {
        method: "POST",
        bodyText,
        contentType: "application/json",
    });
}
