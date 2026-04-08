import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
