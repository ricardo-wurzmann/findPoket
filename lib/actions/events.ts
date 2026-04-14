"use server";

import { z } from "zod";
import { authActionClient, organizerActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { createEventSchema, updateEventSchema } from "@/lib/validations/event";

export const getEvents = authActionClient
  .schema(
    z.object({
      city: z.string().optional(),
      type: z.enum(["TOURNAMENT", "CASH_GAME", "HOME_GAME"]).optional(),
      status: z.enum(["UPCOMING", "LIVE", "FINISHED", "CANCELLED"]).optional(),
      onlyOpen: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const city = parsedInput.city;
    const events = await prisma.event.findMany({
      where: {
        ...(city
          ? {
              OR: [
                { venue: { city } },
                { locationLabel: { contains: city, mode: "insensitive" } },
                { lat: null },
              ],
            }
          : {}),
        ...(parsedInput.type ? { type: parsedInput.type } : {}),
        ...(parsedInput.status ? { status: parsedInput.status } : { status: { in: ["UPCOMING", "LIVE"] } }),
      },
      include: {
        venue: true,
        organizer: { select: { id: true, name: true, handle: true } },
        _count: { select: { registrations: { where: { status: "APPROVED" } } } },
      },
      orderBy: { startsAt: "asc" },
    });

    return { events };
  });

export const getEventById = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const event = await prisma.event.findUnique({
      where: { id: parsedInput.id },
      include: {
        venue: true,
        organizer: { select: { id: true, name: true, handle: true } },
        registrations: {
          where: { status: "APPROVED" },
          include: { user: { select: { id: true, name: true, handle: true } } },
        },
        _count: { select: { registrations: { where: { status: "APPROVED" } } } },
      },
    });

    if (!event) throw new Error("Evento não encontrado");

    return { event };
  });

export const createEvent = organizerActionClient
  .schema(createEventSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { endsAt, buyIn, blindStructure, ...rest } = parsedInput;
    const event = await prisma.event.create({
      data: {
        ...rest,
        buyIn: buyIn ?? 0,
        startsAt: new Date(parsedInput.startsAt),
        ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
        ...(blindStructure ? { blindStructure: blindStructure as object[] } : {}),
        organizerId: ctx.dbUser.id,
      },
    });

    return { event };
  });

export const updateEvent = organizerActionClient
  .schema(
    updateEventSchema.extend({ id: z.string() })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { id, ...data } = parsedInput;

    const existing = await prisma.event.findFirst({
      where: { id, organizerId: ctx.dbUser.id },
    });

    if (!existing) throw new Error("Evento não encontrado ou sem permissão");

    const { endsAt, blindStructure, ...rest } = data;
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.startsAt ? { startsAt: new Date(rest.startsAt) } : {}),
        ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
        ...(blindStructure ? { blindStructure: blindStructure as object[] } : {}),
      },
    });

    return { event };
  });

export const cancelEvent = organizerActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.event.findFirst({
      where: { id: parsedInput.id, organizerId: ctx.dbUser.id },
    });

    if (!existing) throw new Error("Evento não encontrado ou sem permissão");

    const event = await prisma.event.update({
      where: { id: parsedInput.id },
      data: { status: "CANCELLED" },
    });

    return { event };
  });
