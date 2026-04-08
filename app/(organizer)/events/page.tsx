import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTime, eventTypeLabel } from "@/lib/utils";
import Link from "next/link";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
    },
    orderBy: { startsAt: "desc" },
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold">Meus Eventos</h1>
            <p className="tag text-text-muted mt-0.5">{events.length} eventos criados</p>
          </div>
          <Link
            href="/events/create"
            className="bg-text text-background tag px-4 py-2 hover:bg-[#3A3835] transition-colors rounded-sm"
          >
            + Novo Evento
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted border border-border rounded-sm">
            <span className="text-3xl mb-2 opacity-20">◷</span>
            <p className="tag">Nenhum evento criado</p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-sm">
            {events.map((event) => {
              const fillPct = Math.min(100, (event._count.registrations / event.maxPlayers) * 100);
              const statusColors: Record<string, string> = {
                LIVE: "text-green",
                UPCOMING: "text-amber",
                FINISHED: "text-text-muted",
                CANCELLED: "text-red",
              };
              return (
                <div key={event.id} className="flex items-center gap-4 px-4 py-4 hover:bg-surface transition-colors">
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
                      {event.venue?.name ?? event.locationLabel ?? "Local a definir"} ·{" "}
                      {formatDate(event.startsAt)} {formatTime(event.startsAt)}
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

                  <div className="text-right shrink-0">
                    <div className="font-cormorant italic text-xl font-light text-green">
                      {formatCurrency(event.buyIn)}
                    </div>
                    {event.gtd && (
                      <div className="tag text-amber">GTD {formatCurrency(event.gtd)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
