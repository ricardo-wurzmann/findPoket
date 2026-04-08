"use server";

import { z } from "zod";
import { authActionClient, organizerActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";

export const registerForEvent = authActionClient
  .schema(z.object({ eventId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const event = await prisma.event.findUnique({
      where: { id: parsedInput.eventId },
    });

    if (!event) throw new Error("Evento não encontrado");
    if (event.status === "CANCELLED" || event.status === "FINISHED") {
      throw new Error("Evento não está disponível para inscrição");
    }

    const existing = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: ctx.dbUser.id, eventId: parsedInput.eventId } },
    });

    if (existing) throw new Error("Você já está inscrito neste evento");

    const approvedCount = await prisma.registration.count({
      where: { eventId: parsedInput.eventId, status: "APPROVED" },
    });

    if (approvedCount >= event.maxPlayers) {
      throw new Error("Evento lotado");
    }

    const registration = await prisma.registration.create({
      data: {
        userId: ctx.dbUser.id,
        eventId: parsedInput.eventId,
        status: event.isPrivate ? "PENDING" : "APPROVED",
      },
    });

    return { registration };
  });

export const approveRegistration = organizerActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const registration = await prisma.registration.findFirst({
      where: { id: parsedInput.id, event: { organizerId: ctx.dbUser.id } },
    });

    if (!registration) throw new Error("Inscrição não encontrada");

    const updated = await prisma.registration.update({
      where: { id: parsedInput.id },
      data: { status: "APPROVED" },
    });

    return { registration: updated };
  });

export const denyRegistration = organizerActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const registration = await prisma.registration.findFirst({
      where: { id: parsedInput.id, event: { organizerId: ctx.dbUser.id } },
    });

    if (!registration) throw new Error("Inscrição não encontrada");

    const updated = await prisma.registration.update({
      where: { id: parsedInput.id },
      data: { status: "DENIED" },
    });

    return { registration: updated };
  });

export const getRegistrationCount = authActionClient
  .schema(z.object({ eventId: z.string() }))
  .action(async ({ parsedInput }) => {
    const count = await prisma.registration.count({
      where: { eventId: parsedInput.eventId, status: "APPROVED" },
    });

    return { count };
  });

export const getPendingRegistrations = organizerActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const registrations = await prisma.registration.findMany({
      where: {
        status: "PENDING",
        event: { organizerId: ctx.dbUser.id },
      },
      include: {
        user: { select: { id: true, name: true, handle: true, email: true } },
        event: { select: { id: true, name: true, startsAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { registrations };
  });
