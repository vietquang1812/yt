import { AppShell } from "@/components/AppShell";
import { SeriesDetailClient } from "@/features/series/SeriesDetailClient";

export default async function SeriesDetailPage( context : { params: Promise<{ seriesId: string }> }) {
  const {seriesId} = await context.params;
  return (
    <AppShell>
      <SeriesDetailClient seriesId={seriesId} />
    </AppShell>
  );
}
