import { AppShell } from "@/components/AppShell";
import { ProjectsPageClient } from "@/features/projects/ProjectsPageClient";

export default async function ProjectsPage(props: { params: Promise<{ channelId: string }> }) {
    const { channelId } = await props.params
    return (
        <AppShell>
            <ProjectsPageClient channelId={channelId} />
        </AppShell>
    );
}
