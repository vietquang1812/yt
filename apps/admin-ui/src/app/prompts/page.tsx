import { AppShell } from "@/components/AppShell";
import { PromptChannelClient } from "@/features/prompts/PromptChannelClient";
export default async function ProjectsPage() {
  return (
    <AppShell>
      <PromptChannelClient />
    </AppShell>
  );
}
