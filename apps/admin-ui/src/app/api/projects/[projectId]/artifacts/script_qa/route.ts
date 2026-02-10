import { proxyToOrchestrator } from '@/lib/bff/proxyToOrchestrator';

export async function PUT(req: Request, props: { params: Promise<{ projectId: string }> }) {

    const { projectId } = await props.params;
    const bodyText = await req.text();
    return proxyToOrchestrator(
        `/projects/${projectId}/artifacts/script_qa`,
        {
            method: "PUT",
            bodyText,
            contentType: "application/json",
        }
    );
}
