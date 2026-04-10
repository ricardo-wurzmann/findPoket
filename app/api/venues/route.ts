import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

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
