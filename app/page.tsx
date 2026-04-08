import { redirect } from "next/navigation";

export default async function RootPage() {
  // If Supabase not configured, go straight to login
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  const { createClient } = await import("@/lib/supabase/server");
  const { prisma } = await import("@/lib/prisma");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { role: true },
  });

  if (dbUser?.role === "ORGANIZER") {
    redirect("/dashboard");
  }

  redirect("/feed");
}
