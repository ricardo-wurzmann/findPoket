import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";
import { z } from "zod";

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

const createVenueSchema = z.object({
  name: z.string().min(3).max(120),
  district: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  address: z.string().min(5).max(200),
  whatsapp: z.string().min(8).max(20),
  website: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url("URL inválida").optional()
  ),
  openTime: z.string().min(1),
  closeTime: z.string().min(1),
  tableCount: z.string().min(1).max(50),
  lat: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number()
  ),
  lng: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number()
  ),
});

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createVenueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { name, district, city, address, whatsapp, website, openTime, closeTime, tableCount, lat, lng } = parsed.data;

  const venue = await prisma.venue.create({
    data: {
      name,
      district,
      city,
      address,
      whatsapp,
      website: website ?? null,
      openTime,
      closeTime,
      tableCount,
      lat,
      lng,
      ownerId: dbUser.id,
      isActive: true,
    },
  });

  return NextResponse.json({ venue }, { status: 201 });
}