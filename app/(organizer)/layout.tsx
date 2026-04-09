import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, name: true, handle: true, role: true },
  });

  // Race condition: Prisma write may not be visible yet right after signup redirect.
  // Retry once after a short delay before giving up.
  if (!dbUser) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, name: true, handle: true, role: true },
    });
  }

  if (!dbUser || dbUser.role !== "ORGANIZER") {
    redirect("/feed");
  }

  const pendingCount = await prisma.registration.count({
    where: {
      status: "PENDING",
      event: { organizerId: dbUser.id },
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userName={dbUser.name}
        userHandle={dbUser.handle ?? undefined}
        userRole="ORGANIZER"
        pendingCount={pendingCount}
      />
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}
