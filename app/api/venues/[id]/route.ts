import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          interests: true,
        },
      },
    },
  });

  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  return NextResponse.json({ venue });
}
