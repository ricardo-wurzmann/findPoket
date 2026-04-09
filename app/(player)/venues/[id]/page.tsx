import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatTime } from "@/lib/utils";
import { format, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeclareVenueInterestButton } from "@/components/venues/DeclareVenueInterestButton";
import { ShareButton } from "@/components/venues/ShareButton";

interface Props {
  params: Promise<{ id: string }>;
}

function isOpenNow(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  let closeMins = ch * 60 + cm;
  if (closeMins < openMins) closeMins += 24 * 60;
  const adjusted = nowMins < openMins ? nowMins + 24 * 60 : nowMins;
  return adjusted >= openMins && adjusted <= closeMins;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function VenueProfilePage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) redirect("/login");

  const now = new Date();

  const venue = await prisma.venue.findUnique({
    where: { id, isActive: true },
    include: {
      owner: { select: { id: true, name: true, handle: true } },
      events: {
        where: {
          status: { in: ["UPCOMING", "LIVE"] },
          startsAt: { gte: now },
        },
        orderBy: { startsAt: "asc" },
      },
      _count: { select: { interests: true } },
    },
  });

  if (!venue) notFound();

  const userInterest = await prisma.venueInterest.findUnique({
    where: { userId_venueId: { userId: dbUser.id, venueId: id } },
  });

  const open = isOpenNow(venue.openTime, venue.closeTime);
  const tournaments = venue.events.filter((e) => e.type === "TOURNAMENT");
  const cashGames = venue.events.filter((e) => e.type === "CASH_GAME");

  // Group events by day of week for schedule grid
  const scheduleMap: Record<number, typeof venue.events> = {};
  venue.events.forEach((e) => {
    const day = getDay(new Date(e.startsAt));
    if (!scheduleMap[day]) scheduleMap[day] = [];
    scheduleMap[day].push(e);
  });
  const scheduledDays = Object.keys(scheduleMap)
    .map(Number)
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));

  const whatsappNumber = venue.whatsapp.replace(/\D/g, "");
  const whatsappHref = `https://wa.me/55${whatsappNumber}`;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Back nav */}
      <div className="border-b border-border bg-background px-6 py-3 pl-16 lg:pl-6">
        <Link href="/venues" className="tag text-text-muted hover:text-text transition-colors">
          ← Casas
        </Link>
      </div>

      {/* Dark header */}
      <div className="bg-sidebar relative overflow-hidden">
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 font-cormorant italic font-light leading-none select-none pointer-events-none"
          style={{ fontSize: "120px", color: "rgba(255,255,255,0.04)" }}
        >
          ♠
        </div>

        <div className="relative px-6 py-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`tag flex items-center gap-1.5 ${open ? "text-green" : "text-[#6B6660]"}`}>
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block ${open ? "bg-green animate-pulse" : "bg-[#6B6660]"}`}
              />
              {open ? "Aberto agora" : "Fechado"}
            </span>
          </div>
          <h1 className="font-cormorant italic text-4xl font-light text-white leading-tight mb-1">
            {venue.name}
          </h1>
          <p className="tag text-[#9B9690]">
            {venue.district} · {venue.city}
          </p>
        </div>
      </div>

      {/* Info strip */}
      <div className="border-b border-border bg-surface">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-border">
          <div className="px-5 py-4">
            <div className="tag text-text-muted mb-1">Abre</div>
            <div className="text-[13px] font-medium">{venue.openTime}</div>
          </div>
          <div className="px-5 py-4">
            <div className="tag text-text-muted mb-1">Fecha</div>
            <div className="text-[13px] font-medium">{venue.closeTime}</div>
          </div>
          <div className="px-5 py-4">
            <div className="tag text-text-muted mb-1">Mesas</div>
            <div className="text-[13px] font-medium">{venue.tableCount}</div>
          </div>
          <div className="px-5 py-4">
            <div className="tag text-text-muted mb-1">Endereço</div>
            <div className="text-[12px] font-medium truncate">{venue.address}</div>
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="flex-1 bg-background">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

          {/* Cash Game section */}
          <section className="border border-border rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">Cash Game</h2>
              {cashGames.length > 0 && (
                <span className="tag text-green flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green inline-block animate-pulse" />
                  Rodando
                </span>
              )}
            </div>
            <div className="px-5 py-5">
              {cashGames.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {cashGames.map((cg) => (
                    <div key={cg.id} className="flex items-center justify-between">
                      <span className="text-[13px] font-medium">{cg.name}</span>
                      {cg.blinds && (
                        <span className="tag text-text-muted">{cg.blinds}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-[13px] font-medium">{venue.tableCount} mesas disponíveis</p>
                  <p className="tag text-text-muted mt-0.5">Consulte os horários e games disponíveis</p>
                </div>
              )}

              <DeclareVenueInterestButton
                venueId={venue.id}
                initialCount={venue._count.interests}
                initialDeclared={!!userInterest}
              />
            </div>
          </section>

          {/* Upcoming tournaments */}
          <section>
            <h2 className="tag text-text-muted mb-3">Torneios agendados</h2>
            {tournaments.length === 0 ? (
              <div className="border border-border rounded-sm px-5 py-6 text-center">
                <span className="text-2xl opacity-20 block mb-2">♦</span>
                <p className="tag text-text-muted">Nenhum torneio agendado</p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-sm">
                {tournaments.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors"
                  >
                    {/* Date */}
                    <div className="w-12 shrink-0 text-center">
                      <div className="font-cormorant italic text-2xl font-light text-text leading-none">
                        {format(new Date(event.startsAt), "d")}
                      </div>
                      <div className="tag text-text-muted mt-0.5 capitalize">
                        {format(new Date(event.startsAt), "EEE", { locale: ptBR })}
                      </div>
                    </div>

                    <div className="w-px h-8 bg-border shrink-0" />

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{event.name}</div>
                      <div className="tag text-text-muted mt-0.5">
                        {formatTime(event.startsAt)}
                        {event.maxPlayers ? ` · ${event.maxPlayers} vagas` : ""}
                      </div>
                    </div>

                    {/* Buy-in */}
                    <div className="text-right shrink-0">
                      <div className="font-cormorant italic text-lg font-light text-green leading-none">
                        {formatCurrency(event.buyIn)}
                      </div>
                      {event.gtd && (
                        <div className="tag text-amber mt-0.5">GTD {formatCurrency(event.gtd)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Weekly schedule */}
          {scheduledDays.length > 0 && (
            <section>
              <h2 className="tag text-text-muted mb-3">Grade semanal</h2>
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
                          <div key={e.id} className="flex items-center justify-between">
                            <span className="text-[12px] font-medium truncate">{e.name}</span>
                            <span className="tag text-text-muted ml-3 shrink-0">
                              {formatTime(e.startsAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Contact */}
          <section>
            <h2 className="tag text-text-muted mb-3">Contato</h2>
            <div className="space-y-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border border-border px-4 py-3 rounded-sm hover:border-[#B8B4AC] transition-colors"
              >
                <span className="text-base">💬</span>
                <div>
                  <div className="text-[13px] font-medium">WhatsApp</div>
                  <div className="tag text-text-muted">{venue.whatsapp}</div>
                </div>
              </a>

              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border border-border px-4 py-3 rounded-sm hover:border-[#B8B4AC] transition-colors"
                >
                  <span className="text-base">🌐</span>
                  <div>
                    <div className="text-[13px] font-medium">Site Oficial</div>
                    <div className="tag text-text-muted truncate max-w-[200px]">{venue.website}</div>
                  </div>
                </a>
              )}

              <ShareButton />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
