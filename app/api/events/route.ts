import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

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
              { lat: null },
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

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser || dbUser.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    name?: string;
    type?: string;
    buyIn?: number;
    maxPlayers?: number;
    startsAt?: string;
    description?: string | null;
    gtd?: number | null;
    startingStack?: string | null;
    levelDuration?: string | null;
    rebuyPolicy?: string | null;
    blinds?: string | null;
    locationLabel?: string | null;
    venueId?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, type, buyIn, maxPlayers, startsAt } = body;

  if (!name || !type || buyIn === undefined || !startsAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      name,
      type: type as "TOURNAMENT" | "CASH_GAME" | "HOME_GAME",
      buyIn,
      maxPlayers: maxPlayers ?? 0,
      startsAt: new Date(startsAt),
      organizerId: dbUser.id,
      description: body.description ?? null,
      gtd: body.gtd ?? null,
      startingStack: body.startingStack ?? null,
      levelDuration: body.levelDuration ?? null,
      rebuyPolicy: body.rebuyPolicy ?? null,
      blinds: body.blinds ?? null,
      locationLabel: body.locationLabel ?? null,
      venueId: body.venueId ?? null,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
