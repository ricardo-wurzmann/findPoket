import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json({ venues: [], events: [], players: [] });
  }

  const [venues, events, players] = await Promise.all([
    prisma.venue.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { district: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, district: true, city: true },
      take: 5,
    }),
    prisma.event.findMany({
      where: {
        status: { in: ["UPCOMING", "LIVE"] },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { locationLabel: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, startsAt: true, buyIn: true, status: true },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        role: "PLAYER",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { handle: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, handle: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ venues, events, players });
}
