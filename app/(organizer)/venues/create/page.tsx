import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function OrganizerVenueCreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { role: true },
  });
  if (!dbUser || dbUser.role !== "ORGANIZER") redirect("/feed");

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <h1 className="text-[15px] font-semibold mb-2">Nova Casa</h1>
      <p className="tag text-text-muted max-w-md mb-6">
        O cadastro de novas casas pelo app está em preparação. Por enquanto, as casas vinculadas à sua conta aparecem no dashboard.
      </p>
      <Link href="/dashboard" className="tag bg-text text-background px-4 py-2 rounded-sm">
        Voltar ao dashboard
      </Link>
    </div>
  );
}
