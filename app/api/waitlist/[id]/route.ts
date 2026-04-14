import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase/get-user-from-request";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await prisma.waitlist.findFirst({
    where: { id, userId: dbUser.id },
  });

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.waitlist.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
