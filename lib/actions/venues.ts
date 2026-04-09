"use server";

import { z } from "zod";
import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";

export const getVenues = authActionClient
  .schema(z.object({}))
  .action(async () => {
    const venues = await prisma.venue.findMany({
      where: { isActive: true },
      include: {
        events: {
          where: { status: { in: ["UPCOMING", "LIVE"] } },
          select: { id: true, name: true, startsAt: true, status: true, type: true, buyIn: true },
          orderBy: { startsAt: "asc" },
          take: 5,
        },
        _count: {
          select: {
            events: { where: { status: { in: ["UPCOMING", "LIVE"] }, type: "TOURNAMENT" } },
            interests: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return { venues };
  });

export const getVenueById = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const now = new Date();
    const venue = await prisma.venue.findUnique({
      where: { id: parsedInput.id },
      include: {
        owner: { select: { id: true, name: true, handle: true } },
        events: {
          where: {
            status: { in: ["UPCOMING", "LIVE"] },
            startsAt: { gte: now },
          },
          orderBy: { startsAt: "asc" },
        },
        _count: { select: { interests: true } },
      },
    });
    if (!venue) throw new Error("Casa não encontrada");
    return { venue };
  });

export const declareVenueInterest = authActionClient
  .schema(z.object({ venueId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    await prisma.venueInterest.upsert({
      where: { userId_venueId: { userId: ctx.dbUser.id, venueId: parsedInput.venueId } },
      create: { userId: ctx.dbUser.id, venueId: parsedInput.venueId },
      update: {},
    });

    const count = await prisma.venueInterest.count({
      where: { venueId: parsedInput.venueId },
    });

    return { count, message: "Interesse declarado com sucesso" };
  });

export const hasVenueInterest = authActionClient
  .schema(z.object({ venueId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const interest = await prisma.venueInterest.findUnique({
      where: { userId_venueId: { userId: ctx.dbUser.id, venueId: parsedInput.venueId } },
    });
    return { hasInterest: !!interest };
  });
