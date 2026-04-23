import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { format, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrganizerCashTablesClient } from "./OrganizerCashTablesClient";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Organizer venue management — player public view uses `/venues/[id]`. */
export default async function OrganizerVenueDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ORGANIZER") redirect("/feed");

  const { id } = await params;

  const venue = await prisma.venue.findFirst({
    where: { id, ownerId: dbUser.id },
    include: {
      cashTables: { orderBy: { createdAt: "asc" } },
      events: {
        where: { status: { in: ["UPCOMING", "LIVE"] } },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!venue) notFound();

  const now = new Date();
  const tournaments = venue.events.filter((e) => e.type === "TOURNAMENT" && new Date(e.startsAt) >= now);

  const scheduleMap: Record<number, typeof venue.events> = {};
  venue.events.forEach((e) => {
    const day = getDay(new Date(e.startsAt));
    if (!scheduleMap[day]) scheduleMap[day] = [];
    scheduleMap[day].push(e);
  });
  const scheduledDays = Object.keys(scheduleMap)
    .map(Number)
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-border bg-background px-6 py-5 pl-16 lg:pl-6">
        <Link href="/dashboard" className="tag text-text-muted hover:text-text transition-colors block mb-3">
          ← Dashboard
        </Link>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[15px] font-semibold">{venue.name}</h1>
            <p className="tag text-text-muted mt-1">
              {venue.district} · {venue.city} · {venue.address}
            </p>
            <p className="tag mt-1">
              <span className={venue.isActive ? "text-green" : "text-text-muted"}>
                {venue.isActive ? "Ativa" : "Inativa"}
              </span>
            </p>
          </div>
          <Link
            href={`/venues/${venue.id}`}
            className="tag text-text border border-border px-3 py-2 rounded-sm hover:bg-surface transition-colors shrink-0"
          >
            Ver como jogador
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl">
        <OrganizerCashTablesClient venueId={venue.id} initialTables={venue.cashTables} />

        <section>
          <h2 className="tag text-text-muted mb-3">Torneios</h2>
          {tournaments.length === 0 ? (
            <div className="border border-border rounded-sm px-5 py-6 text-center">
              <p className="tag text-text-muted">Nenhum torneio UPCOMING/LIVE.</p>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-sm">
              {tournaments.map((event) => (
                <div key={event.id} className="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors">
                  <div className="w-12 shrink-0 text-center">
                    <div className="font-cormorant italic text-2xl font-light text-text leading-none">
                      {format(new Date(event.startsAt), "d")}
                    </div>
                    <div className="tag text-text-muted mt-0.5 capitalize">
                      {format(new Date(event.startsAt), "EEE", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{event.name}</div>
                    <div className="tag text-text-muted mt-0.5">
                      {formatTime(event.startsAt)}
                      {event.maxPlayers ? ` · ${event.maxPlayers} vagas` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-cormorant italic text-lg font-light text-green leading-none">
                      {formatCurrency(event.buyIn)}
                    </div>
                  </div>
                  <Link
                    href={`/events/${event.id}/edit`}
                    className="tag text-text-muted hover:text-text border border-border px-2 py-1 rounded-sm transition-colors shrink-0"
                  >
                    Editar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {scheduledDays.length > 0 && (
          <section className="mt-8">
            <h2 className="tag text-text-muted mb-3">Grade semanal (todos os eventos)</h2>
            <div className="divide-y divide-border border border-border rounded-sm">
              {scheduledDays.map((dayNum) => {
                const dayEvents = scheduleMap[dayNum];
                return (
                  <div key={dayNum} className="flex items-start gap-4 px-4 py-3">
                    <div className="w-16 shrink-0 pt-0.5">
                      <span className="tag text-text-muted">{DAY_NAMES[dayNum]}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      {dayEvents.map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-medium truncate">{e.name}</span>
                          <span className="tag text-text-muted shrink-0">{formatTime(e.startsAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
