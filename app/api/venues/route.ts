import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venues = await prisma.venue.findMany({
    where: { isActive: true },
    include: {
      events: {
        where: { status: { in: ["UPCOMING", "LIVE"] } },
        select: { id: true, name: true, startsAt: true, status: true, type: true, buyIn: true },
        orderBy: { startsAt: "asc" },
        take: 5,
      },
      _count: {
        select: {
          events: { where: { status: { in: ["UPCOMING", "LIVE"] }, type: "TOURNAMENT" } },
          interests: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ venues });
}
