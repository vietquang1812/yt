import { AppShell } from "@/components/AppShell";
import { SeriesPageClient } from "@/features/series/SeriesPageClient";

export default function SeriesPage() {
  return (
    <AppShell>
      <SeriesPageClient />
    </AppShell>
  );
}
