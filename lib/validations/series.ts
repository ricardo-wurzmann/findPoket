import { z } from "zod";
import { datetimeLocalSchema, optionalDatetimeLocalSchema } from "@/lib/validations/shared";

function optionalCoord(val: unknown): number | undefined {
  if (val === "" || val === undefined || val === null) return undefined;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : undefined;
}

export const createSeriesSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(1000).optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  district: z.string().optional(),
  lat: z.preprocess(optionalCoord, z.number().optional()),
  lng: z.preprocess(optionalCoord, z.number().optional()),
  whatsapp: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  startsAt: datetimeLocalSchema,
  endsAt: optionalDatetimeLocalSchema,
});

export const updateSeriesSchema = createSeriesSchema.partial();

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;
export type UpdateSeriesInput = z.infer<typeof updateSeriesSchema>;
