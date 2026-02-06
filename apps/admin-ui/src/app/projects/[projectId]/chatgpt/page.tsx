import { AppShell } from "@/components/AppShell";
import { getProjectId } from "@/features/projects/getProjectId";
import { ProjectChatGPTPageClient } from "@/features/projects/ProjectChatGPTPageClient";

export default async function ProjectChatGPTPage(
  props: { params: Promise<{ projectId: string }> }
) {
  const projectId = await getProjectId(props);

  return (
    <AppShell>
      <ProjectChatGPTPageClient projectId={projectId} />
    </AppShell>
  );
}
