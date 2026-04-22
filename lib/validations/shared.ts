import { z } from "zod";

function normaliseDatetimeLocal(val: string): string {
  if (val.includes("Z") || val.match(/[+-]\d{2}:\d{2}$/)) return val;
  const base = val.length === 16 ? `${val}:00` : val;
  return `${base}.000Z`;
}

/** Required datetime-local → full ISO */
export const datetimeLocalSchema = z
  .string()
  .min(1, "Data e horário obrigatórios")
  .transform(normaliseDatetimeLocal)
  .pipe(z.string().datetime({ message: "Data e horário inválidos" }));

/** Optional datetime-local (empty string → undefined) */
export const optionalDatetimeLocalSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string" || val === "") return undefined;
    return normaliseDatetimeLocal(val);
  },
  z.string().datetime({ message: "Data e horário inválidos" }).optional()
);
