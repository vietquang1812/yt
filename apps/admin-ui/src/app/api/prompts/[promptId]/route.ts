import { proxyToOrchestrator } from '@/lib/bff/proxyToOrchestrator';

export async function PUT(req: Request, props: { params: Promise<{ promptId: string }> }) {

    const { promptId } = await props.params;
    const bodyText = await req.text();
    return proxyToOrchestrator(
        `/prompts/${promptId}`,
        {
            method: "PUT",
            bodyText,
            contentType: "application/json",
        }
    );
}
