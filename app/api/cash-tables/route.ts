import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";
import { createCashTableSchema } from "@/lib/validations/cashTable";
import { fetchGroupedActiveCashTables } from "@/lib/cash-tables-grouped";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const grouped = await fetchGroupedActiveCashTables();
  return NextResponse.json({ grouped });
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = createCashTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const venue = await prisma.venue.findFirst({
    where: { id: parsed.data.venueId, ownerId: dbUser.id },
    select: { id: true },
  });
  if (!venue) {
    return NextResponse.json({ error: "Venue not found or forbidden" }, { status: 403 });
  }

  const { notes, ...rest } = parsed.data;
  const table = await prisma.cashTable.create({
    data: {
      ...rest,
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ table }, { status: 201 });
}
