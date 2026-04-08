import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      name: true,
      handle: true,
      role: true,
    },
  });

  const pendingCount = dbUser?.role === "ORGANIZER"
    ? await prisma.registration.count({
        where: {
          status: "PENDING",
          event: { organizerId: dbUser.id },
        },
      })
    : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userName={dbUser?.name ?? "Jogador"}
        userHandle={dbUser?.handle ?? undefined}
        userRole={dbUser?.role as "PLAYER" | "ORGANIZER"}
        pendingCount={pendingCount}
      />
      <main className="flex-1 min-w-0 flex flex-col lg:pt-0 pt-0">
        {children}
      </main>
    </div>
  );
}
