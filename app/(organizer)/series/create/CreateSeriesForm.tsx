"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSeries } from "@/lib/actions/series";
import { createSeriesSchema, type CreateSeriesInput } from "@/lib/validations/series";
import { cn } from "@/lib/utils";

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#E2DDD6] bg-white">
      <div className="px-4 py-3 border-b border-[#E2DDD6]">
        <span className="text-[9px] uppercase tracking-widest font-medium text-[#9C9890]">{title}</span>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

export function CreateSeriesForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSeriesInput>({
    resolver: zodResolver(createSeriesSchema),
    defaultValues: { website: "" },
  });

  const inputCls =
    "w-full border border-[#E2DDD6] bg-[#F2F0EC] text-[#2C2A27] text-[13px] px-3 py-2.5 focus:border-[#B8B4AC] transition-colors placeholder:text-[#B8B4AC] outline-none";

  const onSubmit = async (data: CreateSeriesInput) => {
    setServerError(null);
    try {
      const res = await createSeries(data);
      if (res?.serverError) {
        setServerError(res.serverError);
        return;
      }
      router.push("/dashboard");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Erro ao criar série");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F2F0EC]">
      <div className="border-b border-[#E2DDD6] bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold text-[#2C2A27]">Nova Série</h1>
            <p className="text-[10px] uppercase tracking-wider text-[#9C9890] mt-0.5">Circuito ou temporada</p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[11px] text-[#9C9890] hover:text-[#2C2A27] transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-6 py-6 space-y-4">
          <CardSection title="Série">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                Nome da série *
              </label>
              <input {...register("name")} type="text" className={inputCls} placeholder="BSOP Winter 2025" />
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Descrição</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full border border-[#E2DDD6] bg-[#F2F0EC] text-[#2C2A27] text-[13px] px-3 py-2.5 focus:border-[#B8B4AC] transition-colors resize-none outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                  Data início *
                </label>
                <input {...register("startsAt")} type="datetime-local" className={inputCls} />
                {errors.startsAt && <p className="text-[11px] text-red-600 mt-1">{errors.startsAt.message}</p>}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                  Data término
                </label>
                <input {...register("endsAt")} type="datetime-local" className={inputCls} />
              </div>
            </div>
          </CardSection>

          <CardSection title="Local">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">
                Endereço completo *
              </label>
              <input {...register("address")} type="text" className={inputCls} />
              {errors.address && <p className="text-[11px] text-red-600 mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Bairro / Distrito</label>
              <input {...register("district")} type="text" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Cidade *</label>
              <input {...register("city")} type="text" className={inputCls} />
              {errors.city && <p className="text-[11px] text-red-600 mt-1">{errors.city.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Latitude</label>
                <input {...register("lat")} type="number" step="any" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Longitude</label>
                <input {...register("lng")} type="number" step="any" className={inputCls} />
              </div>
            </div>
          </CardSection>

          <CardSection title="Contato">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">WhatsApp</label>
              <input {...register("whatsapp")} type="text" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Website</label>
              <input {...register("website")} type="url" placeholder="https://" className={inputCls} />
              {errors.website && <p className="text-[11px] text-red-600 mt-1">{errors.website.message}</p>}
            </div>
          </CardSection>

          {serverError && <p className="text-[12px] text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-3 text-[12px] font-semibold uppercase tracking-wider transition-colors",
              "bg-[#2C2A27] text-white hover:bg-[#1a1917] disabled:opacity-50"
            )}
          >
            {isSubmitting ? "Salvando…" : "Criar série"}
          </button>
        </form>
      </div>
    </div>
  );
}
