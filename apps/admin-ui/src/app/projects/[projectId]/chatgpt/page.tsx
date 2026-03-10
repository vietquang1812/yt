import { AppShell } from "@/components/AppShell";
import { ProjectChatGPTPageClient } from "@/features/projects/components/chatGPT/ProjectChatGPTPageClient";
import { getProjectId } from "@/features/projects/getProjectId";

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
