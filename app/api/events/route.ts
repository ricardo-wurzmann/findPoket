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
      series: {
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
          address: true,
          startsAt: true,
          endsAt: true,
          lat: true,
          lng: true,
        },
      },
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

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, type, buyIn, maxPlayers, startsAt } = body as {
    name?: string;
    type?: string;
    buyIn?: number;
    maxPlayers?: number;
    startsAt?: string;
  };

  if (!name || !type || !startsAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      name: name as string,
      type: type as "TOURNAMENT" | "CASH_GAME" | "HOME_GAME",
      buyIn: typeof buyIn === "number" ? buyIn : 0,
      maxPlayers: typeof maxPlayers === "number" ? maxPlayers : 0,
      startsAt: new Date(startsAt as string),
      organizerId: dbUser.id,
      description: typeof body.description === "string" ? body.description : null,
      gtd: typeof body.gtd === "number" ? body.gtd : null,
      startingStack: typeof body.startingStack === "string" ? body.startingStack : null,
      levelDuration: typeof body.levelDuration === "string" ? body.levelDuration : null,
      rebuyPolicy: typeof body.rebuyPolicy === "string" ? body.rebuyPolicy : null,
      blinds: typeof body.blinds === "string" ? body.blinds : null,
      locationLabel: typeof body.locationLabel === "string" ? body.locationLabel : null,
      seriesId: typeof body.seriesId === "string" ? body.seriesId : null,
      venueId:
        typeof body.seriesId === "string" && body.seriesId
          ? null
          : typeof body.venueId === "string"
            ? body.venueId
            : null,
      // Cash Game fields
      blindType: typeof body.blindType === "string" ? body.blindType : null,
      sbValue: typeof body.sbValue === "number" ? body.sbValue : null,
      bbValue: typeof body.bbValue === "number" ? body.bbValue : null,
      btnValue: typeof body.btnValue === "number" ? body.btnValue : null,
      straddleValue: typeof body.straddleValue === "number" ? body.straddleValue : null,
      buyinMin: typeof body.buyinMin === "number" ? body.buyinMin : null,
      buyinMax: typeof body.buyinMax === "number" ? body.buyinMax : null,
      tableCount: typeof body.tableCount === "number" ? body.tableCount : null,
      seatsPerTable: typeof body.seatsPerTable === "number" ? body.seatsPerTable : null,
      rake: typeof body.rake === "number" ? body.rake : null,
      rakeCap: typeof body.rakeCap === "number" ? body.rakeCap : null,
      hideRake: typeof body.hideRake === "boolean" ? body.hideRake : false,
      // Tournament fields
      startStack: typeof body.startStack === "number" ? body.startStack : null,
      blindStructure: Array.isArray(body.blindStructure) ? body.blindStructure : undefined,
      rebuyEnabled: typeof body.rebuyEnabled === "boolean" ? body.rebuyEnabled : false,
      rebuyStack: typeof body.rebuyStack === "number" ? body.rebuyStack : null,
      rebuyPrice: typeof body.rebuyPrice === "number" ? body.rebuyPrice : null,
      rebuyLimit: typeof body.rebuyLimit === "string" ? body.rebuyLimit : null,
      rebuyLimitCustom: typeof body.rebuyLimitCustom === "number" ? body.rebuyLimitCustom : null,
      rebuyUntil: typeof body.rebuyUntil === "string" ? body.rebuyUntil : null,
      rebuyUntilLevel: typeof body.rebuyUntilLevel === "number" ? body.rebuyUntilLevel : null,
      addonEnabled: typeof body.addonEnabled === "boolean" ? body.addonEnabled : false,
      addonStack: typeof body.addonStack === "number" ? body.addonStack : null,
      addonPrice: typeof body.addonPrice === "number" ? body.addonPrice : null,
      addonWhen: typeof body.addonWhen === "string" ? body.addonWhen : null,
      addonStackLimit: typeof body.addonStackLimit === "boolean" ? body.addonStackLimit : false,
      addonStackLimitVal: typeof body.addonStackLimitVal === "number" ? body.addonStackLimitVal : null,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
