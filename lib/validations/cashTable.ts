import { z } from "zod";

export const createCashTableSchema = z.object({
  venueId: z.string().uuid(),
  name: z.string().min(2).max(80),
  variant: z.enum(["NLH", "PLO", "PLO Hi-Lo", "Mixed"]),
  blindType: z.enum(["sb-bb", "button"]),
  sbValue: z.number().min(0).optional(),
  bbValue: z.number().min(0).optional(),
  btnValue: z.number().min(0).optional(),
  buyinMin: z.number().min(0).optional(),
  buyinMax: z.number().min(0).optional(),
  seats: z.number().int().min(2).max(20).default(9),
  notes: z.string().max(300).optional(),
});

export const updateCashTableSchema = createCashTableSchema
  .omit({ venueId: true })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateCashTableInput = z.infer<typeof createCashTableSchema>;
export type UpdateCashTableInput = z.infer<typeof updateCashTableSchema>;
