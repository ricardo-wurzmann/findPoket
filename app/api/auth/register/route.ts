import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    handle?: string | null;
    email?: string;
    city?: string | null;
    role?: "PLAYER" | "ORGANIZER";
    birthDate?: string | null;
    phone?: string | null;
    profession?: string | null;
    hendonMob?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, handle, email, city, role, birthDate, phone, profession, hendonMob } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (existing) {
    return NextResponse.json({ success: true, user: existing });
  }

  const dbUser = await prisma.user.create({
    data: {
      supabaseId: user.id,
      email,
      name,
      handle: handle ?? null,
      city: city ?? null,
      role: role ?? "PLAYER",
      birthDate: birthDate ? new Date(birthDate) : null,
      phone: phone ?? null,
      profession: profession ?? null,
      hendonMob: hendonMob ?? null,
    },
  });

  return NextResponse.json({ success: true, user: dbUser });
}
