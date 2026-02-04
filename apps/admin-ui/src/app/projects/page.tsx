import { AppShell } from "@/components/AppShell";
import { ProjectsPageClient } from "@/features/projects/ProjectsPageClient";

export default function ProjectsPage() {
  return (
    <AppShell>
      <ProjectsPageClient />
    </AppShell>
  );
}
