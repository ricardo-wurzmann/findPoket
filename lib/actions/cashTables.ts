"use server";

import { z } from "zod";
import { authActionClient, organizerActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { createCashTableSchema, updateCashTableSchema } from "@/lib/validations/cashTable";

async function assertVenueOwner(venueId: string, userId: string) {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId: userId },
    select: { id: true },
  });
  if (!venue) throw new Error("Casa não encontrada ou sem permissão");
}

export const createCashTable = organizerActionClient
  .schema(createCashTableSchema)
  .action(async ({ parsedInput, ctx }) => {
    await assertVenueOwner(parsedInput.venueId, ctx.dbUser.id);
    const { notes, ...rest } = parsedInput;
    const table = await prisma.cashTable.create({
      data: {
        ...rest,
        notes: notes ?? null,
      },
    });
    return { table };
  });

export const toggleCashTable = organizerActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      isActive: z.boolean(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.cashTable.findFirst({
      where: { id: parsedInput.id, venue: { ownerId: ctx.dbUser.id } },
    });
    if (!existing) throw new Error("Mesa não encontrada ou sem permissão");
    const table = await prisma.cashTable.update({
      where: { id: parsedInput.id },
      data: { isActive: parsedInput.isActive },
    });
    return { table };
  });

export const deleteCashTable = organizerActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.cashTable.findFirst({
      where: { id: parsedInput.id, venue: { ownerId: ctx.dbUser.id } },
    });
    if (!existing) throw new Error("Mesa não encontrada ou sem permissão");
    await prisma.cashTable.delete({ where: { id: parsedInput.id } });
    return { ok: true };
  });

export const getCashTablesByVenue = organizerActionClient
  .schema(z.object({ venueId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    await assertVenueOwner(parsedInput.venueId, ctx.dbUser.id);
    const tables = await prisma.cashTable.findMany({
      where: { venueId: parsedInput.venueId },
      orderBy: { createdAt: "asc" },
    });
    return { tables };
  });

export const updateCashTable = organizerActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      data: updateCashTableSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.cashTable.findFirst({
      where: { id: parsedInput.id, venue: { ownerId: ctx.dbUser.id } },
    });
    if (!existing) throw new Error("Mesa não encontrada ou sem permissão");
    const table = await prisma.cashTable.update({
      where: { id: parsedInput.id },
      data: parsedInput.data,
    });
    return { table };
  });

export const declareCashTableInterest = authActionClient
  .schema(z.object({ cashTableId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const table = await prisma.cashTable.findFirst({
      where: { id: parsedInput.cashTableId, isActive: true },
      include: { venue: { select: { isActive: true } } },
    });
    if (!table || !table.venue.isActive) throw new Error("Mesa não disponível");

    const existing = await prisma.cashTableInterest.findUnique({
      where: {
        userId_cashTableId: { userId: ctx.dbUser.id, cashTableId: parsedInput.cashTableId },
      },
    });
    if (existing && existing.status !== "DENIED") {
      throw new Error("Você já declarou interesse nesta mesa");
    }
    const note = `Cash Game: ${table.name}`;
    if (existing?.status === "DENIED") {
      await prisma.cashTableInterest.update({
        where: { id: existing.id },
        data: { status: "PENDING", note },
      });
      return { message: "Interesse declarado com sucesso" };
    }

    await prisma.cashTableInterest.create({
      data: {
        userId: ctx.dbUser.id,
        cashTableId: parsedInput.cashTableId,
        status: "PENDING",
        note,
      },
    });
    return { message: "Interesse declarado com sucesso" };
  });
