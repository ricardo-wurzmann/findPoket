import { z } from "zod";

export const dealerRequestSchema = z.object({
  gameType: z.string().min(2, "Tipo de jogo obrigatório").max(100),
  dealerQty: z.number().int().min(1).max(10),
  duration: z.string().min(1, "Duração obrigatória"),
  address: z.string().min(5, "Endereço obrigatório").max(200),
  district: z.string().min(2, "Bairro obrigatório").max(100),
  city: z.string().min(2, "Cidade obrigatória").max(100),
  venueName: z.string().max(100).optional(),
  reference: z.string().max(200).optional(),
  whatsapp: z
    .string()
    .min(10, "WhatsApp inválido")
    .max(20)
    .regex(/^[0-9]+$/, "Apenas números"),
  notes: z.string().max(500).optional(),
  scheduledAt: z
    .string()
    .min(1, "Data e horário obrigatórios")
    .transform((val) => {
      if (val.includes("Z") || val.match(/[+-]\d{2}:\d{2}$/)) return val;
      const base = val.length === 16 ? `${val}:00` : val;
      return `${base}.000Z`;
    })
    .pipe(z.string().datetime({ message: "Data e horário inválidos" })),
});

export type DealerRequestInput = z.infer<typeof dealerRequestSchema>;
