import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      events: {
        where: { status: { in: ["UPCOMING", "LIVE"] } },
        select: {
          id: true,
          name: true,
          startsAt: true,
          status: true,
          type: true,
          buyIn: true,
        },
        orderBy: { startsAt: "asc" },
        take: 10,
      },
      _count: {
        select: {
          events: { where: { status: { in: ["UPCOMING", "LIVE"] }, type: "TOURNAMENT" } },
        },
      },
    },
  });

  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  return NextResponse.json({ venue });
}
