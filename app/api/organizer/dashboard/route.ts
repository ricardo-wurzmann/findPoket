import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();

  const [todayRegistrations, events, pendingRequests, venues, series] = await Promise.all([
    prisma.registration.count({
      where: {
        event: { organizerId: dbUser.id },
        status: { in: ["PENDING", "APPROVED"] },
        createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
    }),
    prisma.event.findMany({
      where: { organizerId: dbUser.id },
      include: {
        venue: { select: { name: true, district: true } },
        _count: { select: { registrations: { where: { status: { in: ["PENDING", "APPROVED"] } } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.registration.count({
      where: { event: { organizerId: dbUser.id }, status: "PENDING" },
    }),
    prisma.venue.findMany({
      where: { ownerId: dbUser.id, isActive: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
    prisma.series.findMany({
      where: { organizerId: dbUser.id, isActive: true },
      select: { id: true, name: true, startsAt: true },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  const activeEvents = events.filter(
    (e) => e.status === "UPCOMING" || e.status === "LIVE"
  ).length;

  const estimatedRevenue = events
    .filter((e) => e.status === "UPCOMING" || e.status === "LIVE")
    .reduce((sum, e) => sum + e.buyIn * e._count.registrations, 0);

  return NextResponse.json({
    todayRegistrations,
    estimatedRevenue,
    activeEvents,
    pendingRequests,
    venues,
    series,
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      status: e.status,
      buyIn: e.buyIn,
      startsAt: e.startsAt,
      maxPlayers: e.maxPlayers,
      registrationCount: e._count.registrations,
      venue: e.venue,
    })),
  });
}
