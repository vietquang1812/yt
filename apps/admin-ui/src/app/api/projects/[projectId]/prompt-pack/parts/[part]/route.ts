import { proxyToOrchestrator } from '@/lib/bff/proxyToOrchestrator';

export async function PUT(req: Request, props: { params: Promise<{ projectId: string, part: string}> }) {

    const {projectId, part} = await props.params;
    const bodyText = await req.text();
    return proxyToOrchestrator(
        `/projects/${projectId}/prompt-pack/parts/${part}`,
        {
            method: "PUT",
            bodyText,
            contentType: "application/json",
        }
    );
}
