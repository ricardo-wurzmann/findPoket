"use server";

import { z } from "zod";
import { authActionClient, organizerActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { createSeriesSchema, updateSeriesSchema } from "@/lib/validations/series";

const now = () => new Date();

export async function fetchActiveSeriesList() {
  const n = now();
  return prisma.series.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { events: true } },
      events: {
        where: {
          OR: [
            { status: "LIVE" },
            {
              status: { notIn: ["FINISHED", "CANCELLED"] },
              startsAt: { gte: n },
            },
          ],
        },
        orderBy: { startsAt: "asc" },
        take: 3,
        select: {
          id: true,
          name: true,
          startsAt: true,
          buyIn: true,
          status: true,
          gtd: true,
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}

/** Full series for API GET /api/series/[id] — all non-cancelled events */
export async function fetchSeriesByIdForApi(id: string) {
  return prisma.series.findFirst({
    where: { id, isActive: true },
    include: {
      organizer: { select: { id: true, name: true, handle: true } },
      events: {
        where: { status: { notIn: ["CANCELLED"] } },
        orderBy: { startsAt: "asc" },
        include: {
          venue: { select: { id: true, name: true, district: true } },
          _count: { select: { registrations: { where: { status: "APPROVED" } } } },
        },
      },
    },
  });
}

export const createSeries = organizerActionClient
  .schema(createSeriesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { startsAt, endsAt, website, ...rest } = parsedInput;
    const series = await prisma.series.create({
      data: {
        ...rest,
        organizerId: ctx.dbUser.id,
        startsAt: new Date(startsAt),
        ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
        website: website && website !== "" ? website : null,
      },
    });
    return { series };
  });

export const getSeriesById = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const n = now();
    const series = await prisma.series.findFirst({
      where: { id: parsedInput.id, isActive: true },
      include: {
        organizer: { select: { id: true, name: true, handle: true } },
        events: {
          where: {
            status: { notIn: ["FINISHED", "CANCELLED"] },
            startsAt: { gte: n },
          },
          orderBy: { startsAt: "asc" },
          include: {
            venue: { select: { id: true, name: true, district: true } },
            _count: { select: { registrations: { where: { status: "APPROVED" } } } },
          },
        },
      },
    });
    if (!series) throw new Error("Série não encontrada");
    return { series };
  });

export const getSeriesList = authActionClient
  .schema(z.object({}))
  .action(async () => {
    const series = await fetchActiveSeriesList();
    return { series };
  });

export const getSeriesByIdForOrganizer = organizerActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const series = await prisma.series.findFirst({
      where: { id: parsedInput.id, organizerId: ctx.dbUser.id },
      include: {
        organizer: { select: { id: true, name: true, handle: true } },
        events: {
          orderBy: { startsAt: "asc" },
          include: {
            venue: true,
            _count: { select: { registrations: { where: { status: "APPROVED" } } } },
          },
        },
      },
    });
    if (!series) throw new Error("Série não encontrada ou sem permissão");
    return { series };
  });

export const updateSeries = organizerActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      data: updateSeriesSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.series.findFirst({
      where: { id: parsedInput.id, organizerId: ctx.dbUser.id },
    });
    if (!existing) throw new Error("Série não encontrada ou sem permissão");

    const { startsAt, endsAt, website, ...rest } = parsedInput.data;
    const series = await prisma.series.update({
      where: { id: parsedInput.id },
      data: {
        ...rest,
        ...(startsAt !== undefined ? { startsAt: new Date(startsAt) } : {}),
        ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
        ...(website !== undefined
          ? { website: website && website !== "" ? website : null }
          : {}),
      },
    });
    return { series };
  });
