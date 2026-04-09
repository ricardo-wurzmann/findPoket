import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
              { locationLabel: { contains: city, mode: "insensitive" } },
              { lat: null }, // no coordinates → can't filter by city, always include
            ],
          }
        : {}),
      ...(type ? { type: type as "TOURNAMENT" | "CASH_GAME" | "HOME_GAME" } : {}),
      ...(onlyOpen
        ? { registrations: { none: { status: "APPROVED" } } }
        : {}),
    },
    include: {
      venue: true,
      organizer: { select: { id: true, name: true, handle: true } },
      _count: { select: { registrations: { where: { status: { in: ["PENDING", "APPROVED"] } } } } },
    },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ events });
}
