"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDealerRequest } from "@/lib/actions/dealer";
import { dealerRequestSchema, type DealerRequestInput } from "@/lib/validations/dealer";
import { cn } from "@/lib/utils";

const GAME_TYPES = [
  "No Limit Hold'em (NLH)",
  "Pot Limit Omaha (PLO)",
  "PLO Hi-Lo",
  "Short Deck",
  "Mixed Games",
  "Outro",
];

const DURATIONS = [
  { value: "1h", label: "1 hora" },
  { value: "2h", label: "2 horas" },
  { value: "3h", label: "3 horas" },
  { value: "4h", label: "4 horas" },
  { value: "5h", label: "5 horas" },
  { value: "outro", label: "Acima de 5h" },
];

const DEALER_COUNTS = [1, 2, 3, 4];

export default function DealerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [dealerCount, setDealerCount] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState("4h");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DealerRequestInput>({
    resolver: zodResolver(dealerRequestSchema),
    defaultValues: {
      dealerQty: 1,
      city: "São Paulo",
      duration: "4h",
    },
  });

  const onSubmit = async (data: DealerRequestInput) => {
    setServerError(null);
    try {
      const result = await createDealerRequest({ ...data, dealerQty: dealerCount });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setProtocol(result?.data?.protocol ?? "");
      setSubmitted(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Erro ao enviar solicitação");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-5 pl-16 lg:pl-6">
          <h1 className="text-[15px] font-semibold">Solicitar Dealer</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="font-cormorant italic text-6xl font-light text-text mb-4">✓</div>
            <h2 className="text-[16px] font-semibold mb-2">Solicitação Enviada</h2>
            <p className="text-text-muted text-[13px] mb-6">
              Nossa equipe entrará em contato pelo WhatsApp em até 2 horas.
            </p>
            <div className="border border-border bg-surface px-6 py-4 rounded-sm">
              <div className="tag text-text-muted mb-1">Protocolo</div>
              <div className="font-cormorant italic text-2xl font-light text-text">{protocol}</div>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 w-full border border-border py-2.5 tag text-text-muted hover:text-text hover:border-[#B8B4AC] transition-colors rounded-sm"
            >
              Nova Solicitação
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Dark header strip */}
      <div className="bg-sidebar border-b border-sidebar-border px-6 py-5 pl-16 lg:pl-6">
        <div className="tag text-[#6B6660] mb-1">Serviço Premium</div>
        <h1 className="text-white text-[18px] font-semibold">Solicitar Dealer</h1>
        <p className="text-[12px] text-[#6B6660] mt-1">
          Dealers profissionais para seu home game ou torneio privado
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto px-6 py-6 space-y-5">
          {/* Game type */}
          <div>
            <label className="tag text-text-muted block mb-2">Tipo de Jogo</label>
            <select
              {...register("gameType")}
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
            >
              <option value="">Selecione o jogo...</option>
              {GAME_TYPES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {errors.gameType && <p className="text-[11px] text-red mt-1">{errors.gameType.message}</p>}
          </div>

          {/* Date/time */}
          <div>
            <label className="tag text-text-muted block mb-2">Data e Horário</label>
            <input
              {...register("scheduledAt")}
              type="datetime-local"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
            />
            {errors.scheduledAt && <p className="text-[11px] text-red mt-1">{errors.scheduledAt.message}</p>}
          </div>

          {/* Dealer count */}
          <div>
            <label className="tag text-text-muted block mb-2">Quantidade de Dealers</label>
            <div className="flex gap-2">
              {DEALER_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setDealerCount(n);
                    setValue("dealerQty", n);
                  }}
                  className={cn(
                    "w-12 h-10 border tag transition-all duration-150 rounded-sm",
                    dealerCount === n
                      ? "bg-text text-background border-text"
                      : "border-border text-text-muted hover:border-[#B8B4AC] hover:text-text"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="tag text-text-muted block mb-2">Duração</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(d.value);
                    setValue("duration", d.value);
                  }}
                  className={cn(
                    "px-3 py-1.5 border tag transition-all duration-150 rounded-sm",
                    selectedDuration === d.value
                      ? "bg-text text-background border-text"
                      : "border-border text-text-muted hover:border-[#B8B4AC] hover:text-text"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {errors.duration && <p className="text-[11px] text-red mt-1">{errors.duration.message}</p>}
          </div>

          {/* Venue name */}
          <div>
            <label className="tag text-text-muted block mb-2">
              Nome do Local <span className="opacity-50">(opcional)</span>
            </label>
            <input
              {...register("venueName")}
              type="text"
              placeholder="Casa / Clube / Nome do local"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tag text-text-muted block mb-2">Bairro</label>
              <input
                {...register("district")}
                type="text"
                placeholder="Pinheiros"
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
              />
              {errors.district && <p className="text-[11px] text-red mt-1">{errors.district.message}</p>}
            </div>
            <div>
              <label className="tag text-text-muted block mb-2">Cidade</label>
              <input
                {...register("city")}
                type="text"
                placeholder="São Paulo"
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
              />
              {errors.city && <p className="text-[11px] text-red mt-1">{errors.city.message}</p>}
            </div>
          </div>

          <div>
            <label className="tag text-text-muted block mb-2">Endereço completo</label>
            <input
              {...register("address")}
              type="text"
              placeholder="Rua, número"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
            {errors.address && <p className="text-[11px] text-red mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="tag text-text-muted block mb-2">
              Referência <span className="opacity-50">(opcional)</span>
            </label>
            <input
              {...register("reference")}
              type="text"
              placeholder="Próximo ao..."
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="tag text-text-muted block mb-2">WhatsApp para contato</label>
            <input
              {...register("whatsapp")}
              type="tel"
              placeholder="11999990000"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
            {errors.whatsapp && <p className="text-[11px] text-red mt-1">{errors.whatsapp.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="tag text-text-muted block mb-2">
              Observações <span className="opacity-50">(opcional)</span>
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Número de mesas, jogadores esperados, etc."
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors resize-none placeholder:text-text-light"
            />
          </div>

          {serverError && (
            <div className="text-[12px] text-red bg-red/5 border border-red/20 px-3 py-2 rounded-sm">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-text text-background py-3 text-[12px] font-semibold tracking-wide hover:bg-[#3A3835] active:scale-[0.98] transition-all duration-150 rounded-sm disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Solicitar Dealer"}
          </button>

          <p className="tag text-text-muted text-center">
            Ao enviar, você concorda com nossos{" "}
            <span className="underline cursor-pointer hover:text-text">termos de serviço</span>
          </p>
        </form>
      </div>
    </div>
  );
}
