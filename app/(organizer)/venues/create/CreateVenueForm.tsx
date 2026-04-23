"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

const createVenueSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(120),
  district: z.string().min(2, "Bairro obrigatório").max(80),
  city: z.string().min(2, "Cidade obrigatória").max(80),
  address: z.string().min(5, "Endereço obrigatório").max(200),
  whatsapp: z.string().min(8, "WhatsApp obrigatório").max(20),
  website: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url("URL inválida").optional()
  ),
  openTime: z.string().min(1, "Horário de abertura obrigatório"),
  closeTime: z.string().min(1, "Horário de fechamento obrigatório"),
  tableCount: z.string().min(1, "Informe o número de mesas"),
  lat: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().optional()
  ),
  lng: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().optional()
  ),
});

type CreateVenueInput = z.infer<typeof createVenueSchema>;

interface Props {
  organizerId: string;
}

function CardSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-[#E2DDD6] bg-white">
      <div className="px-4 py-3 border-b border-[#E2DDD6]">
        <span className="text-[9px] uppercase tracking-widest font-medium text-[#9C9890]">
          {title}
        </span>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

export function CreateVenueForm({ organizerId }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateVenueInput>({
    resolver: zodResolver(createVenueSchema),
    defaultValues: {
      openTime: "18:00",
      closeTime: "04:00",
      tableCount: "1",
    },
  });

  const inputCls =
    "w-full border border-[#E2DDD6] bg-[#F2F0EC] text-[#2C2A27] text-[13px] px-3 py-2.5 focus:border-[#B8B4AC] transition-colors placeholder:text-[#B8B4AC] outline-none";

  const onSubmit = async (data: CreateVenueInput) => {
    setServerError(null);
    try {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          lat: data.lat ?? 0,
          lng: data.lng ?? 0,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error ?? "Erro ao criar casa");
        return;
      }

      router.push("/dashboard");
    } catch {
      setServerError("Erro ao criar casa. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F2F0EC]">
      <div className="border-b border-[#E2DDD6] bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold text-[#2C2A27]">Nova Casa</h1>
            <p className="text-[10px] uppercase tracking-wider text-[#9C9890] mt-0.5">
              Cadastrar casa de poker
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-[11px] text-[#9C9890] hover:text-[#2C2A27] transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-2xl mx-auto px-6 py-6 space-y-4"
        >
          <CardSection title="Informações da Casa">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                Nome da Casa *
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Ex: King's Poker Club"
                className={inputCls}
              />
              {errors.name && (
                <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                  Bairro *
                </label>
                <input
                  {...register("district")}
                  type="text"
                  placeholder="Ex: Pinheiros"
                  className={inputCls}
                />
                {errors.district && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.district.message}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                  Cidade *
                </label>
                <input
                  {...register("city")}
                  type="text"
                  placeholder="Ex: São Paulo"
                  className={inputCls}
                />
                {errors.city && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                Endereço completo *
              </label>
              <input
                {...register("address")}
                type="text"
                placeholder="Ex: Rua dos Pinheiros, 123"
                className={inputCls}
              />
              {errors.address && (
                <p className="text-[11px] text-red-600 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                  Latitude (opcional)
                </label>
                <input
                  {...register("lat")}
                  type="number"
                  step="any"
                  placeholder="-23.5505"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                  Longitude (opcional)
                </label>
                <input
                  {...register("lng")}
                  type="number"
                  step="any"
                  placeholder="-46.6333"
                  className={inputCls}
                />
              </div>
            </div>
            <p className="text-[10px] text-[#9C9890]">
              Para aparecer no mapa. Em SP: lat -23.55, lng -46.63
            </p>
          </CardSection>

          <CardSection title="Contato">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                WhatsApp *
              </label>
              <input
                {...register("whatsapp")}
                type="tel"
                placeholder="11 9 9999-0000"
                className={inputCls}
              />
              {errors.whatsapp && (
                <p className="text-[11px] text-red-600 mt-1">{errors.whatsapp.message}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                Website (opcional)
              </label>
              <input
                {...register("website")}
                type="url"
                placeholder="https://seusite.com.br"
                className={inputCls}
              />
              {errors.website && (
                <p className="text-[11px] text-red-600 mt-1">{errors.website.message}</p>
              )}
            </div>
          </CardSection>

          <CardSection title="Funcionamento">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                  Abre *
                </label>
                <input
                  {...register("openTime")}
                  type="time"
                  className={inputCls}
                />
                {errors.openTime && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.openTime.message}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                  Fecha *
                </label>
                <input
                  {...register("closeTime")}
                  type="time"
                  className={inputCls}
                />
                {errors.closeTime && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.closeTime.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                Número de mesas *
              </label>
              <input
                {...register("tableCount")}
                type="text"
                placeholder="Ex: 8 mesas de cash"
                className={inputCls}
              />
              {errors.tableCount && (
                <p className="text-[11px] text-red-600 mt-1">{errors.tableCount.message}</p>
              )}
            </div>
          </CardSection>

          {serverError && (
            <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 px-3 py-2">
              {serverError}
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-[#E2DDD6] py-3 text-[12px] font-medium text-[#6B6760] hover:border-[#B8B4AC] hover:text-[#2C2A27] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 bg-[#2C2A27] text-white py-3 text-[12px] font-semibold tracking-wide transition-all duration-150",
                "hover:bg-[#3A3835] active:scale-[0.98] disabled:opacity-60"
              )}
            >
              {isSubmitting ? "Criando..." : "Criar Casa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}