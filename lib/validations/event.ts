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

const blindLevelSchema = z.object({
  type: z.enum(["level", "break", "latereg"]),
  dur: z.number().int().min(1),
  sb: z.number().optional(),
  bb: z.number().optional(),
  ante: z.number().optional(),
  label: z.string().optional(),
});

export type BlindLevel = z.infer<typeof blindLevelSchema>;

export const createEventSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(120),
  type: z.enum(["TOURNAMENT", "CASH_GAME", "HOME_GAME"]),
  description: z.string().max(1000).optional(),
  buyIn: z.number().min(0).optional(),
  maxPlayers: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      if (typeof val === "number" && !Number.isFinite(val)) return undefined;
      return val;
    },
    z.number().int().min(0).max(1000).optional().default(0)
  ),
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

  // Cash Game fields
  blindType: z.enum(["sb-bb", "button"]).optional(),
  sbValue: z.number().min(0).optional(),
  bbValue: z.number().min(0).optional(),
  btnValue: z.number().min(0).optional(),
  straddleValue: z.number().min(0).optional(),
  buyinMin: z.number().min(0).optional(),
  buyinMax: z.number().min(0).optional(),
  tableCount: z.number().int().min(1).optional(),
  seatsPerTable: z.number().int().min(2).optional(),
  rake: z.number().min(0).max(100).optional(),
  rakeCap: z.number().min(0).optional(),
  hideRake: z.boolean().optional(),

  // Tournament fields
  startStack: z.number().int().min(0).optional(),
  blindStructure: z.array(blindLevelSchema).optional(),
  rebuyEnabled: z.boolean().optional(),
  rebuyStack: z.number().int().min(0).optional(),
  rebuyPrice: z.number().min(0).optional(),
  rebuyLimit: z.string().optional(),
  rebuyLimitCustom: z.number().int().min(0).optional(),
  rebuyUntil: z.string().optional(),
  rebuyUntilLevel: z.number().int().min(0).optional(),
  addonEnabled: z.boolean().optional(),
  addonStack: z.number().int().min(0).optional(),
  addonPrice: z.number().min(0).optional(),
  addonWhen: z.string().optional(),
  addonStackLimit: z.boolean().optional(),
  addonStackLimitVal: z.number().int().min(0).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["UPCOMING", "LIVE", "FINISHED", "CANCELLED"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
