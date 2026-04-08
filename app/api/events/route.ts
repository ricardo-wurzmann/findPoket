import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const onlyOpen = searchParams.get("onlyOpen") === "true";

  const events = await prisma.event.findMany({
    where: {
      status: { in: ["UPCOMING", "LIVE"] },
      ...(city
        ? {
            OR: [
              { venue: { city } },
              { venueId: null, locationLabel: { contains: city, mode: "insensitive" } },
              { venueId: null, locationLabel: null },
            ],
          }
        : {}),
      ...(type ? { type: type as "TOURNAMENT" | "CASH_GAME" | "HOME_GAME" | "SIT_AND_GO" } : {}),
      ...(onlyOpen
        ? { registrations: { none: { status: "APPROVED" } } }
        : {}),
    },
    include: {
      venue: true,
      organizer: { select: { id: true, name: true, handle: true } },
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
    },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ events });
}
