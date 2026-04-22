import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getInitials } from "@/lib/utils";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      stats: true,
      registrations: {
        where: { status: "APPROVED" },
        include: {
          event: {
            include: { venue: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!dbUser) redirect("/login");

  const interests = await prisma.registration.findMany({
    where: {
      userId: dbUser.id,
      status: { in: ["PENDING", "APPROVED"] },
      event: { status: { in: ["UPCOMING", "LIVE"] } },
    },
    include: {
      event: {
        include: { venue: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const stats = dbUser.stats;
  const interestEventIds = new Set(interests.map((i) => i.eventId));
  const upcoming = dbUser.registrations
    .filter(
      (r) =>
        new Date(r.event.startsAt) > new Date() &&
        r.event.status !== "CANCELLED" &&
        !interestEventIds.has(r.eventId)
    )
    .slice(0, 5);

  // Only show achievements when the user has real tournament history
  const hasAchievements = (stats?.tournaments ?? 0) > 0;
  const achievements = hasAchievements
    ? [
        { label: "1º lugar", event: "BSOP São Paulo 2023", prize: "R$ 48.000", icon: "♠" },
        { label: "3º lugar", event: "KSOP Santos 2023", prize: "R$ 12.500", icon: "♥" },
        { label: "Top 10", event: "WPT Brasil 2022", prize: "R$ 8.200", icon: "♦" },
      ]
    : [];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-5">
        <h1 className="text-[15px] font-semibold">Perfil</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row min-h-full">
          {/* Left dark panel */}
          <div className="bg-sidebar lg:w-72 p-6 flex flex-col gap-6 shrink-0">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[#2A2926] border border-sidebar-border rounded-sm flex items-center justify-center mb-3">
                <span className="font-cormorant italic text-4xl font-light text-white">
                  {getInitials(dbUser.name)}
                </span>
              </div>
              <h2 className="text-white text-[16px] font-semibold">{dbUser.name}</h2>
              {dbUser.handle && (
                <p className="tag text-[#6B6660] mt-1">@{dbUser.handle}</p>
              )}
              {dbUser.city && (
                <p className="tag text-[#6B6660] mt-0.5">{dbUser.city}</p>
              )}
              <p className="tag text-[#6B6660] mt-2 break-all">{dbUser.email}</p>
            </div>

            {/* Bio */}
            {dbUser.bio && (
              <p className="text-[12px] text-[#9B9690] leading-relaxed border-t border-sidebar-border pt-4">
                {dbUser.bio}
              </p>
            )}

            {/* Additional info */}
            {(dbUser.birthDate || dbUser.phone || dbUser.profession || dbUser.hendonMob) && (
              <div className="border-t border-sidebar-border pt-4 space-y-2">
                {dbUser.birthDate && (
                  <div className="flex items-center justify-between">
                    <span className="tag text-[#6B6660]">Idade</span>
                    <span className="text-[12px] text-white">
                      {differenceInYears(new Date(), dbUser.birthDate)} anos
                    </span>
                  </div>
                )}
                {dbUser.phone && (
                  <div className="flex items-center justify-between">
                    <span className="tag text-[#6B6660]">Telefone</span>
                    <span className="text-[12px] text-white">{dbUser.phone}</span>
                  </div>
                )}
                {dbUser.profession && (
                  <div className="flex items-center justify-between">
                    <span className="tag text-[#6B6660]">Profissão</span>
                    <span className="text-[12px] text-white">{dbUser.profession}</span>
                  </div>
                )}
                {dbUser.hendonMob && (
                  <div className="flex items-center justify-between">
                    <span className="tag text-[#6B6660]">Hendon Mob</span>
                    <a
                      href={`https://pokerdb.thehendonmob.com/player.cfm?USP=${dbUser.hendonMob}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-amber hover:underline"
                    >
                      @{dbUser.hendonMob}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="border-t border-sidebar-border pt-4 space-y-3">
                <div className="tag text-[#6B6660] mb-3">Estatísticas</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="tag text-[#6B6660]">Torneios</div>
                    <div className="font-cormorant italic text-2xl font-light text-white mt-0.5">
                      {stats.tournaments}
                    </div>
                  </div>
                  <div>
                    <div className="tag text-[#6B6660]">ITM%</div>
                    <div className="font-cormorant italic text-2xl font-light text-white mt-0.5">
                      {stats.itm.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="tag text-[#6B6660]">Prêmios</div>
                    <div className="font-cormorant italic text-xl font-light text-amber mt-0.5">
                      {formatCurrency(stats.totalPrize)}
                    </div>
                  </div>
                  <div>
                    <div className="tag text-[#6B6660]">ROI</div>
                    <div className="font-cormorant italic text-2xl font-light text-green mt-0.5">
                      +{stats.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {stats.bestFinish && (
                  <div className="border-t border-sidebar-border pt-3">
                    <div className="tag text-[#6B6660] mb-1">Melhor Resultado</div>
                    <p className="text-[11px] text-[#9B9690] leading-relaxed">{stats.bestFinish}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex-1 p-6 space-y-6">
            {/* Achievements — only if user has tournament history */}
            {achievements.length > 0 && (
              <div>
                <h3 className="tag text-text-muted mb-3">Conquistas Recentes</h3>
                <div className="space-y-2">
                  {achievements.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 border border-border p-3 rounded-sm hover:bg-surface transition-colors"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="w-10 h-10 bg-sidebar border border-sidebar-border rounded-sm flex items-center justify-center shrink-0">
                        <span className="font-cormorant italic text-xl text-white">{a.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="tag text-text-muted mb-0.5">{a.label}</div>
                        <div className="text-[13px] font-medium">{a.event}</div>
                      </div>
                      <div className="font-cormorant italic text-xl font-light text-amber shrink-0">
                        {a.prize}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Declared interests */}
            {interests.length > 0 && (
              <div>
                <h3 className="tag text-text-muted mb-3">Interesses declarados</h3>
                <div className="space-y-2">
                  {interests.map((reg) => (
                    <Link
                      key={reg.id}
                      href="/feed"
                      className="flex items-center justify-between border border-border p-3 rounded-sm hover:bg-surface transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="text-[13px] font-medium truncate">{reg.event.name}</div>
                        <div className="tag text-text-muted mt-0.5">
                          {reg.event.venue?.name ?? reg.event.locationLabel ?? "Local a definir"} ·{" "}
                          {format(new Date(reg.event.startsAt), "d MMM yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-cormorant italic text-xl font-light text-green">
                          {formatCurrency(reg.event.buyIn)}
                        </div>
                        <div
                          className={
                            reg.status === "PENDING"
                              ? "tag text-amber"
                              : "tag text-green"
                          }
                        >
                          {reg.status === "PENDING" ? "Aguardando" : "Confirmado"}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming registrations */}
            {upcoming.length > 0 && (
              <div>
                <h3 className="tag text-text-muted mb-3">Próximas Inscrições</h3>
                <div className="space-y-2">
                  {upcoming.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between border border-border p-3 rounded-sm"
                    >
                      <div>
                        <div className="text-[13px] font-medium">{reg.event.name}</div>
                        <div className="tag text-text-muted mt-0.5">
                          {reg.event.venue?.name ?? "Local a definir"} ·{" "}
                          {format(new Date(reg.event.startsAt), "d MMM", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-cormorant italic text-xl font-light text-green">
                          {formatCurrency(reg.event.buyIn)}
                        </div>
                        <div className="tag text-green">Inscrito</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
