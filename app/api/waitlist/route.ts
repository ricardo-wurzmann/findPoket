import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const entry = await prisma.waitlist.findFirst({
    where: {
      eventId,
      userId: dbUser.id,
      status: { in: ["WAITING", "CALLED"] },
    },
  });

  if (!entry) {
    return NextResponse.json({ entry: null, position: null, count: 0 });
  }

  const position = await prisma.waitlist.count({
    where: {
      eventId,
      status: "WAITING",
      createdAt: { lte: entry.createdAt },
    },
  });

  const count = await prisma.waitlist.count({
    where: { eventId, status: "WAITING" },
  });

  return NextResponse.json({ entry, position, count });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { eventId?: string };
  if (!body.eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const existing = await prisma.waitlist.findFirst({
    where: {
      eventId: body.eventId,
      userId: dbUser.id,
      status: { in: ["WAITING", "CALLED"] },
    },
  });

  if (existing) {
    const count = await prisma.waitlist.count({
      where: { eventId: body.eventId, status: "WAITING" },
    });
    return NextResponse.json({ entry: existing, count }, { status: 200 });
  }

  const entry = await prisma.waitlist.create({
    data: {
      eventId: body.eventId,
      userId: dbUser.id,
      name: dbUser.name,
      status: "WAITING",
    },
  });

  const count = await prisma.waitlist.count({
    where: { eventId: body.eventId, status: "WAITING" },
  });

  return NextResponse.json({ entry, count }, { status: 201 });
}
