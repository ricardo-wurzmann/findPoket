import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Organizer series management (URL `/my-series/[id]` — player public view uses `/series/[id]`). */
export default async function OrganizerSeriesDetailPage({ params }: PageProps) {
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

  const series = await prisma.series.findFirst({
    where: { id, organizerId: dbUser.id },
    include: {
      events: {
        orderBy: { startsAt: "asc" },
        include: {
          venue: true,
          _count: { select: { registrations: { where: { status: "APPROVED" } } } },
        },
      },
    },
  });

  if (!series) notFound();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-5 pl-16 lg:pl-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[15px] font-semibold">{series.name}</h1>
            <p className="tag text-text-muted mt-1">
              {formatDate(series.startsAt)}
              {series.endsAt ? ` — ${formatDate(series.endsAt)}` : ""} · {series.address}, {series.city}
            </p>
          </div>
          <Link
            href={`/events/create?seriesId=${series.id}`}
            className="bg-text text-background tag px-4 py-2 hover:bg-[#3A3835] transition-colors rounded-sm text-center shrink-0"
          >
            Adicionar Torneio
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h2 className="tag text-text-muted mb-4">Eventos da série</h2>
        {series.events.length === 0 ? (
          <div className="border border-border rounded-sm p-8 text-center text-text-muted tag">
            Nenhum evento.{" "}
            <Link href={`/events/create?seriesId=${series.id}`} className="text-text underline">
              Criar torneio
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-sm">
            {series.events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 px-4 py-4 hover:bg-surface transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{event.name}</div>
                  <div className="tag text-text-muted mt-0.5">
                    {formatDate(event.startsAt)} {formatTime(event.startsAt)} ·{" "}
                    {event.venue?.name ?? "Avulso"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-cormorant italic text-xl font-light text-green">
                    {formatCurrency(event.buyIn)}
                  </div>
                  <div className="tag text-text-muted">{event._count.registrations} interesses</div>
                </div>
                <Link
                  href={`/events/${event.id}/edit`}
                  className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#E2DDD6] hover:border-[#B8B4AC] hover:bg-[#F5F4F1] transition-colors rounded-sm"
                  title="Editar evento"
                >
                  <Pencil size={13} className="text-[#9C9890]" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
