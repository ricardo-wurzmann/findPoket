"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEvent } from "@/lib/actions/events";
import { createEventSchema, type CreateEventInput } from "@/lib/validations/event";
import { cn } from "@/lib/utils";
import Link from "next/link";

const EVENT_TYPES = [
  { id: "HOME_GAME", label: "Home Game" },
  { id: "TOURNAMENT", label: "Torneio" },
  { id: "CASH_GAME", label: "Cash Game" },
] as const;

export default function AnnouncePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string>("HOME_GAME");
  const [isPrivate, setIsPrivate] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      type: "HOME_GAME",
      isPrivate: false,
      isMajor: false,
      maxPlayers: 18,
      buyIn: 100,
    },
  });

  const isCashGame = eventType === "CASH_GAME";

  const handleTypeChange = (type: string) => {
    setEventType(type);
    setValue("type", type as CreateEventInput["type"]);
    if (type === "CASH_GAME") {
      setValue("buyIn", 0);
      setValue("startingStack", undefined);
      setValue("levelDuration", undefined);
    }
  };

  const handlePrivateToggle = () => {
    const next = !isPrivate;
    setIsPrivate(next);
    setValue("isPrivate", next);
  };

  const onSubmit = async (data: CreateEventInput) => {
    setServerError(null);
    try {
      const payload: CreateEventInput = { ...data };
      if (isCashGame) {
        payload.buyIn = 0;
        payload.startingStack = undefined;
        payload.levelDuration = undefined;
      }
      const result = await createEvent(payload);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      router.push("/feed");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Erro ao criar evento");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-5">
        <h1 className="text-[15px] font-semibold mb-1">Anunciar Evento</h1>
        <p className="tag text-text-muted">Crie um home game ou evento privado</p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto px-6 py-6 space-y-5">
          {/* Event type */}
          <div>
            <label className="tag text-text-muted block mb-2">Tipo de Evento</label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeChange(t.id)}
                  className={cn(
                    "py-2.5 border tag transition-all duration-150 rounded-sm",
                    eventType === t.id
                      ? "bg-text text-background border-text"
                      : "border-border text-text-muted hover:border-[#B8B4AC] hover:text-text"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="tag text-text-muted block mb-2">Nome do Evento</label>
            <input
              {...register("name")}
              type="text"
              placeholder="Quinta Night — NLHE Turbo"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
            {errors.name && <p className="text-[11px] text-red mt-1">{errors.name.message}</p>}
          </div>

          {/* Date/time */}
          <div>
            <label className="tag text-text-muted block mb-2">Data e Horário</label>
            <input
              {...register("startsAt")}
              type="datetime-local"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
            />
            {errors.startsAt && <p className="text-[11px] text-red mt-1">{errors.startsAt.message}</p>}
          </div>

          {/* Buy-in & Max players */}
          <div className={cn("grid gap-3", isCashGame ? "grid-cols-1" : "grid-cols-2")}>
            {!isCashGame && (
              <div>
                <label className="tag text-text-muted block mb-2">Buy-in (R$)</label>
                <input
                  {...register("buyIn", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step={10}
                  placeholder="200"
                  className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
                />
                {errors.buyIn && <p className="text-[11px] text-red mt-1">{errors.buyIn.message}</p>}
              </div>
            )}
            <div>
              <label className="tag text-text-muted block mb-2">Máx. Jogadores</label>
              <input
                {...register("maxPlayers", { valueAsNumber: true })}
                type="number"
                min={2}
                max={500}
                placeholder="18"
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
              />
              {errors.maxPlayers && <p className="text-[11px] text-red mt-1">{errors.maxPlayers.message}</p>}
            </div>
          </div>

          {/* Cash Game: Blinds */}
          {isCashGame && (
            <div>
              <label className="tag text-text-muted block mb-2">Blinds</label>
              <input
                {...register("blinds")}
                type="text"
                placeholder="Ex: 1/2, 2/5, 5/10"
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
              />
            </div>
          )}

          {/* Location */}
          <div>
            <label className="tag text-text-muted block mb-2">Local</label>
            <input
              {...register("locationLabel")}
              type="text"
              placeholder="Bairro ou nome do local (não endereço completo)"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
          </div>

          {/* Structure — only for non-cash-game */}
          {!isCashGame && (
            <>
              <div>
                <label className="tag text-text-muted block mb-2">Stack Inicial <span className="opacity-50">(opcional)</span></label>
                <input
                  {...register("startingStack")}
                  type="text"
                  placeholder="20.000 fichas"
                  className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
                />
              </div>

              <div>
                <label className="tag text-text-muted block mb-2">Duração dos Níveis <span className="opacity-50">(opcional)</span></label>
                <input
                  {...register("levelDuration")}
                  type="text"
                  placeholder="15 minutos"
                  className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
                />
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="tag text-text-muted block mb-2">Descrição <span className="opacity-50">(opcional)</span></label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Detalhes sobre o evento..."
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors resize-none placeholder:text-text-light"
            />
          </div>

          {/* Private toggle */}
          <div className="border border-border p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium">Evento Privado</div>
                <div className="tag text-text-muted mt-0.5">
                  Inscrições precisam de aprovação
                </div>
              </div>
              <button
                type="button"
                onClick={handlePrivateToggle}
                className={cn(
                  "w-12 h-6 rounded-full transition-all duration-150 relative",
                  isPrivate ? "bg-text" : "bg-border"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-150",
                    isPrivate ? "left-7" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Dealer CTA */}
          <div className="border border-border bg-surface p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium">Precisa de dealer?</div>
                <div className="tag text-text-muted mt-0.5">
                  Dealers profissionais disponíveis
                </div>
              </div>
              <Link
                href="/dealer"
                className="tag text-text border border-border px-3 py-1.5 hover:border-[#B8B4AC] transition-colors rounded-sm"
              >
                Solicitar →
              </Link>
            </div>
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
            {isSubmitting ? "Publicando..." : "Publicar Evento"}
          </button>
        </form>
      </div>
    </div>
  );
}
