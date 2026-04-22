import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function OrganizerSeriesListPage() {
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

  const series = await prisma.series.findMany({
    where: { organizerId: dbUser.id, isActive: true },
    include: { _count: { select: { events: true } } },
    orderBy: { startsAt: "desc" },
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F2F0EC]">
      <div className="border-b border-[#E2DDD6] bg-white px-6 py-5 pl-16 lg:pl-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold text-[#2C2A27]">Minhas Séries</h1>
            <p className="text-[10px] uppercase tracking-wider text-[#9C9890] mt-0.5">
              {series.length} série{series.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/series/create"
            className="bg-[#2C2A27] text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded-sm hover:bg-[#1a1917]"
          >
            Nova Série
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {series.length === 0 ? (
          <div className="border border-[#E2DDD6] bg-white p-8 text-center text-[#9C9890] text-[13px]">
            Nenhuma série ainda.{" "}
            <Link href="/series/create" className="text-[#2C2A27] underline">
              Criar série
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {series.map((s) => (
              <Link
                key={s.id}
                href={`/my-series/${s.id}`}
                className="block border border-[#E2DDD6] bg-white p-4 hover:border-[#B8B4AC] transition-colors"
              >
                <div className="text-[14px] font-semibold text-[#2C2A27]">{s.name}</div>
                <div className="text-[11px] text-[#9C9890] mt-1">
                  {format(new Date(s.startsAt), "d MMM yyyy", { locale: ptBR })}
                  {s.endsAt ? ` — ${format(new Date(s.endsAt), "d MMM yyyy", { locale: ptBR })}` : ""} ·{" "}
                  {s.city}
                </div>
                <div className="text-[11px] text-amber mt-2">{s._count.events} torneio{s._count.events !== 1 ? "s" : ""}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
