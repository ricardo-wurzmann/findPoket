import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, record } = body;

    if (type === "INSERT" && record?.email) {
      // Handle new user created via Supabase Auth webhook
      const existing = await prisma.user.findUnique({
        where: { supabaseId: record.id },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            supabaseId: record.id,
            email: record.email,
            name: record.user_metadata?.name ?? record.email.split("@")[0],
            role: record.user_metadata?.role ?? "PLAYER",
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
