import { AppShell } from "@/components/AppShell";
import { ProjectsPageClient } from "@/features/projects/ProjectsPageClient";

export default async function ProjectsPage() {
  return (
    <AppShell>
      <ProjectsPageClient channelId='' />
    </AppShell>
  );
}
