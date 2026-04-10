import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const registrations = await prisma.registration.findMany({
    where: {
      status: "PENDING",
      event: { organizerId: dbUser.id },
    },
    include: {
      user: { select: { id: true, name: true, handle: true, email: true } },
      event: { select: { id: true, name: true, startsAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ registrations });
}
