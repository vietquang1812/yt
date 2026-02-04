import { AppShell } from "@/components/AppShell";
import { getProjectId } from "@/features/projects/getProjectId";
import { ProjectPageClient } from "@/features/projects/ProjectPageClient";

export default async function ProjectPage(props: { params: Promise<{ projectId: string }> }) {
  const projectId = await getProjectId(props);
  return (
    <AppShell>
      <ProjectPageClient projectId={projectId} />
    </AppShell>
  );
}
