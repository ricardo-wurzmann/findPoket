import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTime, eventTypeLabel } from "@/lib/utils";
import Link from "next/link";
import { Pencil } from "lucide-react";

function EventRow({
  event,
}: {
  event: {
    id: string;
    name: string;
    type: string;
    status: string;
    buyIn: number;
    maxPlayers: number;
    startsAt: Date;
    gtd: number | null;
    isMajor: boolean;
    isPrivate: boolean;
    locationLabel: string | null;
    venue: { name: string } | null;
    series: { name: string } | null;
    _count: { registrations: number; waitlist: number };
  };
}) {
  const fillPct = Math.min(
    100,
    event.maxPlayers > 0 ? (event._count.registrations / event.maxPlayers) * 100 : 0
  );
  const statusColors: Record<string, string> = {
    LIVE: "text-green",
    UPCOMING: "text-amber",
    FINISHED: "text-text-muted",
    CANCELLED: "text-red",
  };
  const loc =
    event.venue?.name ?? (event.series ? event.series.name : null) ?? event.locationLabel ?? "Local a definir";

  return (
    <div className="flex items-center gap-4 px-4 py-4 hover:bg-surface transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`tag ${statusColors[event.status] ?? "text-text-muted"}`}>
            {eventTypeLabel(event.type)}
          </span>
          {event.isMajor && <span className="tag text-amber">Major</span>}
          {event.isPrivate && <span className="tag text-text-muted">Privado</span>}
        </div>
        <div className="text-[13px] font-medium truncate">{event.name}</div>
        <div className="tag text-text-muted mt-0.5">
          {loc} · {formatDate(event.startsAt)} {formatTime(event.startsAt)}
        </div>
      </div>

      <div className="w-28 hidden md:block">
        <div className="flex justify-between mb-1">
          <span className="tag text-text-muted">{event._count.registrations}</span>
          <span className="tag text-text-muted">{event.maxPlayers}</span>
        </div>
        <div className="h-px bg-border">
          <div className="h-full bg-text" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      <div className="text-right shrink-0 space-y-1">
        <div className="font-cormorant italic text-xl font-light text-green">{formatCurrency(event.buyIn)}</div>
        {event.gtd && <div className="tag text-amber">GTD {formatCurrency(event.gtd)}</div>}
        {event.type === "CASH_GAME" && (
          <Link
            href={`/events/${event.id}/waitlist`}
            className="block tag text-text-muted hover:text-text transition-colors"
          >
            Fila ({event._count.waitlist ?? 0})
          </Link>
        )}
      </div>

      <Link
        href={`/events/${event.id}/edit`}
        className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#E2DDD6] hover:border-[#B8B4AC] hover:bg-[#F5F4F1] transition-colors rounded-sm"
        title="Editar evento"
      >
        <Pencil size={13} className="text-[#9C9890]" />
      </Link>
    </div>
  );
}

export default async function EventsPage() {
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

  const events = await prisma.event.findMany({
    where: { organizerId: dbUser.id },
    include: {
      venue: true,
      series: { select: { name: true } },
      _count: {
        select: {
          registrations: { where: { status: "APPROVED" } },
          waitlist: { where: { status: "WAITING" } },
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });

  const bySeries = events.filter((e) => e.seriesId != null);
  const byVenue = events.filter((e) => e.seriesId == null && e.venueId != null);
  const avulsos = events.filter((e) => e.seriesId == null && e.venueId == null);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[15px] font-semibold">Meus Eventos</h1>
            <p className="tag text-text-muted mt-0.5">{events.length} eventos criados</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/series/create"
              className="tag border border-border px-4 py-2 rounded-sm hover:bg-surface transition-colors"
            >
              Nova Série
            </Link>
            <Link
              href="/events/create"
              className="bg-text text-background tag px-4 py-2 hover:bg-[#3A3835] transition-colors rounded-sm"
            >
              + Novo Evento
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted border border-border rounded-sm">
            <span className="text-3xl mb-2 opacity-20">◷</span>
            <p className="tag">Nenhum evento criado</p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="tag text-text-muted mb-3">Séries</h2>
              {bySeries.length === 0 ? (
                <p className="tag text-text-muted border border-border rounded-sm px-4 py-3">Nenhum evento em série.</p>
              ) : (
                <div className="divide-y divide-border border border-border rounded-sm">
                  {bySeries.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="tag text-text-muted mb-3">Casas</h2>
              {byVenue.length === 0 ? (
                <p className="tag text-text-muted border border-border rounded-sm px-4 py-3">Nenhum evento em casa.</p>
              ) : (
                <div className="divide-y divide-border border border-border rounded-sm">
                  {byVenue.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="tag text-text-muted mb-3">Avulsos</h2>
              {avulsos.length === 0 ? (
                <p className="tag text-text-muted border border-border rounded-sm px-4 py-3">Nenhum evento avulso.</p>
              ) : (
                <div className="divide-y divide-border border border-border rounded-sm">
                  {avulsos.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
