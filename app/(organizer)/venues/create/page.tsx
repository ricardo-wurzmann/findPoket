import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CreateVenueForm } from "@/app/(organizer)/venues/create/CreateVenueForm";

export default async function OrganizerVenueCreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true },
  });
  if (!dbUser || dbUser.role !== "ORGANIZER") redirect("/feed");

  return <CreateVenueForm organizerId={dbUser.id} />;
}