import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { redirect } from "next/navigation";
import { CalendarEventRow } from "@/components/calendar/CalendarEventRow";

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
    include: {
      venue: true,
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
    },
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
                {monthEvents.map((event) => (
                  <CalendarEventRow key={event.id} event={event} />
                ))}
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
