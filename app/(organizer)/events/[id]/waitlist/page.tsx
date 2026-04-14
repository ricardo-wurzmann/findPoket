import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { WaitlistPanel } from "./WaitlistPanel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WaitlistPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ORGANIZER") redirect("/feed");

  const event = await prisma.event.findFirst({
    where: { id, organizerId: dbUser.id },
    select: { id: true, name: true, type: true },
  });

  if (!event) redirect("/events");

  const entries = await prisma.waitlist.findMany({
    where: { eventId: id },
    include: {
      user: { select: { id: true, name: true, handle: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F2F0EC]">
      <div className="border-b border-[#E2DDD6] bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold text-[#2C2A27]">Lista de Espera</h1>
            <p className="text-[10px] uppercase tracking-wider text-[#9C9890] mt-0.5">{event.name}</p>
          </div>
          <Link
            href="/events"
            className="text-[11px] text-[#9C9890] hover:text-[#2C2A27] transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <WaitlistPanel eventId={id} initialEntries={entries} />
      </div>
    </div>
  );
}
