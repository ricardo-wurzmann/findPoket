import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CreateEventForm } from "./CreateEventForm";

export default async function CreateEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  if (!dbUser) redirect("/login");

  const venues = await prisma.venue.findMany({
    where: { ownerId: dbUser.id },
    select: { id: true, name: true, district: true, lat: true, lng: true },
    orderBy: { name: "asc" },
  });

  return <CreateEventForm venues={venues} />;
}
