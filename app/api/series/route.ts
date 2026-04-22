import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";
import { createSeriesSchema } from "@/lib/validations/series";
import { fetchActiveSeriesList } from "@/lib/actions/series";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const series = await fetchActiveSeriesList();
  return NextResponse.json({ series });
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

  const parsed = createSeriesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { startsAt, endsAt, website, ...rest } = parsed.data;
  const series = await prisma.series.create({
    data: {
      ...rest,
      organizerId: dbUser.id,
      startsAt: new Date(startsAt),
      ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
      website: website && website !== "" ? website : null,
    },
  });

  return NextResponse.json({ series }, { status: 201 });
}
