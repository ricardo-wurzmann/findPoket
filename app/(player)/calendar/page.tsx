import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const threeMonthsAhead = addMonths(now, 3);

  const events = await prisma.event.findMany({
    where: {
      status: { in: ["UPCOMING", "LIVE"] },
      startsAt: { gte: startOfMonth(now), lte: endOfMonth(threeMonthsAhead) },
    },
    include: { venue: true },
    orderBy: { startsAt: "asc" },
  });

  const biggestGtd = events.reduce((max, e) => e.gtd && e.gtd > max ? e.gtd : max, 0);
  const nextEvent = events.find((e) => new Date(e.startsAt) > now);
  const totalEvents = events.length;

  // Group by month
  const grouped: Record<string, typeof events> = {};
  events.forEach((e) => {
    const key = format(new Date(e.startsAt), "yyyy-MM");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const series: Record<string, string> = {
    "BSOP": "#1A6B45",
    "KSOP": "#1A6B45",
    "WPT": "#8B6914",
    "WSOP": "#8B1A1A",
  };

  function getSeriesBadge(name: string) {
    for (const [key, color] of Object.entries(series)) {
      if (name.includes(key)) return { label: key, color };
    }
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-5">
        <h1 className="text-[15px] font-semibold mb-1">Agenda de Torneios</h1>
        <p className="tag text-text-muted">Calendário de eventos poker no Brasil</p>
      </div>

      {/* Stats strip */}
      <div className="border-b border-border bg-surface grid grid-cols-3 divide-x divide-border">
        <div className="px-6 py-4">
          <div className="tag text-text-muted mb-1">Total de Eventos</div>
          <div className="font-cormorant italic text-3xl font-light text-text">{totalEvents}</div>
        </div>
        <div className="px-6 py-4">
          <div className="tag text-text-muted mb-1">Maior Garantido</div>
          <div className="font-cormorant italic text-3xl font-light text-amber">
            {biggestGtd > 0 ? formatCurrency(biggestGtd) : "—"}
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="tag text-text-muted mb-1">Próximo Evento</div>
          <div className="font-cormorant italic text-3xl font-light text-text">
            {nextEvent
              ? format(new Date(nextEvent.startsAt), "d MMM", { locale: ptBR })
              : "—"}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {Object.entries(grouped).map(([monthKey, monthEvents]) => {
          const monthDate = new Date(monthKey + "-01");
          return (
            <div key={monthKey} className="mb-8">
              <h2 className="tag text-text-muted mb-4 capitalize">
                {formatMonthYear(monthDate)}
              </h2>
              <div className="divide-y divide-border border border-border rounded-sm">
                {monthEvents.map((event) => {
                  const badge = getSeriesBadge(event.name);
                  const isLive = event.status === "LIVE";
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors"
                    >
                      {/* Date number */}
                      <div className="w-12 shrink-0 text-center">
                        <div className="font-cormorant italic text-3xl font-light text-text leading-none">
                          {format(new Date(event.startsAt), "d")}
                        </div>
                        <div className="tag text-text-muted mt-0.5">
                          {format(new Date(event.startsAt), "EEE", { locale: ptBR })}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-10 bg-border shrink-0" />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {isLive && (
                            <span className="tag text-green flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
                              Ao Vivo
                            </span>
                          )}
                          {badge && (
                            <span
                              className="tag px-1.5 py-0.5 rounded-sm text-white"
                              style={{ backgroundColor: badge.color }}
                            >
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] font-medium truncate">{event.name}</div>
                        <div className="tag text-text-muted mt-0.5">
                          {event.venue?.name ?? event.locationLabel ?? "Local a definir"}
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="text-right shrink-0">
                        {event.gtd && (
                          <div className="font-cormorant italic text-xl font-light text-amber leading-none">
                            {formatCurrency(event.gtd)}
                          </div>
                        )}
                        <div className="tag text-text-muted mt-0.5">
                          {formatCurrency(event.buyIn)} buy-in
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted">
            <span className="text-4xl mb-3 opacity-20">♦</span>
            <p className="tag">Nenhum evento encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
