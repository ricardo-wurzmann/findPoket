import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CalendarAgendaClient } from "@/components/calendar/CalendarAgendaClient";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const y = now.getFullYear();

  const [events, venues, seriesList] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: { notIn: ["FINISHED", "CANCELLED"] },
        startsAt: { gte: now },
      },
      include: {
        venue: true,
        series: { select: { id: true, name: true, city: true } },
        _count: { select: { registrations: { where: { status: "APPROVED" } } } },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.venue.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true, district: true },
      orderBy: { name: "asc" },
    }),
    prisma.series.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        address: true,
        startsAt: true,
        endsAt: true,
        _count: { select: { events: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const yearEventCount = events.filter((e) => new Date(e.startsAt).getFullYear() === y).length;

  return (
    <CalendarAgendaClient
      events={JSON.parse(JSON.stringify(events)) as never}
      venues={venues}
      seriesList={JSON.parse(JSON.stringify(seriesList)) as never}
      yearEventCount={yearEventCount}
    />
  );
}
