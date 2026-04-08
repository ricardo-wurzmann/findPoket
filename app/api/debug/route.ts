import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "not authenticated" });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, email: true, role: true, name: true },
  });

  return NextResponse.json({
    supabaseId: user.id,
    email: user.email,
    dbUser,
  });
}
