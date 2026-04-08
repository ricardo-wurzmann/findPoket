import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { EditEventForm } from "./EditEventForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  if (!dbUser) redirect("/dashboard");

  const event = await prisma.event.findFirst({
    where: { id, organizerId: dbUser.id },
    include: { venue: true },
  });

  if (!event) redirect("/dashboard");

  const venues = await prisma.venue.findMany({
    where: { ownerId: dbUser.id },
    select: { id: true, name: true, district: true, lat: true, lng: true },
    orderBy: { name: "asc" },
  });

  return <EditEventForm event={event} venues={venues} />;
}
