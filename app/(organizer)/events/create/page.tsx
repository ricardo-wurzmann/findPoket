import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CreateEventForm } from "./CreateEventForm";

export default async function CreateEventPage({
  searchParams,
}: {
  searchParams: Promise<{ seriesId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  if (!dbUser) redirect("/login");

  const sp = await searchParams;

  const [venues, seriesOptions, initialSeries] = await Promise.all([
    prisma.venue.findMany({
      where: { ownerId: dbUser.id },
      select: { id: true, name: true, district: true, lat: true, lng: true },
      orderBy: { name: "asc" },
    }),
    prisma.series.findMany({
      where: { organizerId: dbUser.id, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    sp.seriesId
      ? prisma.series.findFirst({
          where: { id: sp.seriesId, organizerId: dbUser.id, isActive: true },
          select: { id: true, name: true },
        })
      : null,
  ]);

  return (
    <CreateEventForm venues={venues} seriesOptions={seriesOptions} initialSeries={initialSeries} />
  );
}
