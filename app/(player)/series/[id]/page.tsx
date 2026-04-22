import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSeriesByIdForApi } from "@/lib/actions/series";
import { SeriesPlayerView } from "@/components/series/SeriesPlayerView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerSeriesPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const series = await fetchSeriesByIdForApi(id);
  if (!series) notFound();

  return <SeriesPlayerView series={JSON.parse(JSON.stringify(series)) as never} />;
}
