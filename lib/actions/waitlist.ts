"use server";

import { z } from "zod";
import { authActionClient, organizerActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";

export const joinWaitlist = authActionClient
  .schema(z.object({ eventId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.waitlist.findFirst({
      where: {
        eventId: parsedInput.eventId,
        userId: ctx.dbUser.id,
        status: { in: ["WAITING", "CALLED"] },
      },
    });

    if (existing) return { entry: existing, count: 0 };

    const entry = await prisma.waitlist.create({
      data: {
        eventId: parsedInput.eventId,
        userId: ctx.dbUser.id,
        name: ctx.dbUser.name,
        status: "WAITING",
      },
    });

    const count = await prisma.waitlist.count({
      where: { eventId: parsedInput.eventId, status: "WAITING" },
    });

    return { entry, count };
  });

export const leaveWaitlist = authActionClient
  .schema(z.object({ waitlistId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const entry = await prisma.waitlist.findFirst({
      where: { id: parsedInput.waitlistId, userId: ctx.dbUser.id },
    });

    if (!entry) throw new Error("Entrada não encontrada");

    await prisma.waitlist.delete({ where: { id: parsedInput.waitlistId } });

    return { success: true };
  });

export const getWaitlist = organizerActionClient
  .schema(z.object({ eventId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const event = await prisma.event.findFirst({
      where: { id: parsedInput.eventId, organizerId: ctx.dbUser.id },
    });

    if (!event) throw new Error("Evento não encontrado ou sem permissão");

    const entries = await prisma.waitlist.findMany({
      where: { eventId: parsedInput.eventId },
      include: { user: { select: { id: true, name: true, handle: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });

    return { entries };
  });

export const callNextInWaitlist = organizerActionClient
  .schema(z.object({ waitlistId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const entry = await prisma.waitlist.findFirst({
      where: { id: parsedInput.waitlistId },
      include: { event: true },
    });

    if (!entry) throw new Error("Entrada não encontrada");
    if (entry.event.organizerId !== ctx.dbUser.id) throw new Error("Sem permissão");

    const updated = await prisma.waitlist.update({
      where: { id: parsedInput.waitlistId },
      data: { status: "CALLED", calledAt: new Date() },
    });

    return { entry: updated };
  });

export const markSeated = organizerActionClient
  .schema(z.object({ waitlistId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const entry = await prisma.waitlist.findFirst({
      where: { id: parsedInput.waitlistId },
      include: { event: true },
    });

    if (!entry) throw new Error("Entrada não encontrada");
    if (entry.event.organizerId !== ctx.dbUser.id) throw new Error("Sem permissão");

    const updated = await prisma.waitlist.update({
      where: { id: parsedInput.waitlistId },
      data: { status: "SEATED" },
    });

    return { entry: updated };
  });

export const removeFromWaitlist = organizerActionClient
  .schema(z.object({ waitlistId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const entry = await prisma.waitlist.findFirst({
      where: { id: parsedInput.waitlistId },
      include: { event: true },
    });

    if (!entry) throw new Error("Entrada não encontrada");
    if (entry.event.organizerId !== ctx.dbUser.id) throw new Error("Sem permissão");

    await prisma.waitlist.delete({ where: { id: parsedInput.waitlistId } });

    return { success: true };
  });

export const getWaitlistPosition = authActionClient
  .schema(z.object({ eventId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const entry = await prisma.waitlist.findFirst({
      where: {
        eventId: parsedInput.eventId,
        userId: ctx.dbUser.id,
        status: { in: ["WAITING", "CALLED"] },
      },
    });

    if (!entry) return { entry: null, position: null, count: 0 };

    const position = await prisma.waitlist.count({
      where: {
        eventId: parsedInput.eventId,
        status: "WAITING",
        createdAt: { lte: entry.createdAt },
      },
    });

    const count = await prisma.waitlist.count({
      where: { eventId: parsedInput.eventId, status: "WAITING" },
    });

    return { entry, position, count };
  });
