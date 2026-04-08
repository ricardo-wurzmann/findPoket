"use server";

import { actionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { dealerRequestSchema } from "@/lib/validations/dealer";
import { generateProtocol } from "@/lib/utils";

export const createDealerRequest = actionClient
  .schema(dealerRequestSchema)
  .action(async ({ parsedInput }) => {
    let protocol = generateProtocol();

    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.dealerRequest.findUnique({ where: { protocol } });
      if (!existing) break;
      protocol = generateProtocol();
      attempts++;
    }

    const dealerRequest = await prisma.dealerRequest.create({
      data: {
        ...parsedInput,
        scheduledAt: new Date(parsedInput.scheduledAt),
        protocol,
      },
    });

    return { dealerRequest, protocol };
  });
