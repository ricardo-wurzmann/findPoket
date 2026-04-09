import { z } from "zod";

function normaliseDatetimeLocal(val: string): string {
  if (val.includes("Z") || val.match(/[+-]\d{2}:\d{2}$/)) return val;
  const base = val.length === 16 ? `${val}:00` : val;
  return `${base}.000Z`;
}

// Required datetime-local → full ISO
const datetimeLocalSchema = z
  .string()
  .min(1, "Data e horário obrigatórios")
  .transform(normaliseDatetimeLocal)
  .pipe(z.string().datetime({ message: "Data e horário inválidos" }));

// Optional datetime-local (empty string → undefined)
const optionalDatetimeLocalSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string" || val === "") return undefined;
    return normaliseDatetimeLocal(val);
  },
  z.string().datetime({ message: "Data e horário inválidos" }).optional()
);

export const createEventSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(120),
  type: z.enum(["TOURNAMENT", "CASH_GAME", "HOME_GAME"]),
  description: z.string().max(1000).optional(),
  buyIn: z.number().min(0).optional(),
  maxPlayers: z.number().int().min(2).max(1000),
  startsAt: datetimeLocalSchema,
  endsAt: optionalDatetimeLocalSchema,
  isPrivate: z.boolean().default(false),
  isMajor: z.boolean().default(false),
  gtd: z.number().min(0).optional(),
  startingStack: z.string().max(50).optional(),
  levelDuration: z.string().max(50).optional(),
  rebuyPolicy: z.string().max(200).optional(),
  blinds: z.string().max(50).optional(),
  venueId: z.string().uuid().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  locationLabel: z.string().max(200).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["UPCOMING", "LIVE", "FINISHED", "CANCELLED"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
