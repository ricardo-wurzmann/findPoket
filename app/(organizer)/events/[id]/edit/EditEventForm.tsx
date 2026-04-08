"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateEvent } from "@/lib/actions/events";
import { updateEventSchema } from "@/lib/validations/event";
import { cn } from "@/lib/utils";

// Extend with id for the form
const editFormSchema = updateEventSchema.extend({ id: z.string() });
type EditFormInput = z.infer<typeof editFormSchema>;

const EVENT_TYPES = [
  { id: "TOURNAMENT", label: "Torneio" },
  { id: "CASH_GAME", label: "Cash Game" },
  { id: "SIT_AND_GO", label: "Sit & Go" },
  { id: "HOME_GAME", label: "Home Game" },
] as const;

const STATUS_OPTIONS = [
  { id: "UPCOMING", label: "Em Breve" },
  { id: "LIVE", label: "Ao Vivo" },
  { id: "FINISHED", label: "Encerrado" },
  { id: "CANCELLED", label: "Cancelado" },
] as const;

interface EventData {
  id: string;
  name: string;
  type: string;
  description: string | null;
  buyIn: number;
  maxPlayers: number;
  startsAt: Date;
  endsAt: Date | null;
  isPrivate: boolean;
  isMajor: boolean;
  gtd: number | null;
  startingStack: string | null;
  levelDuration: string | null;
  rebuyPolicy: string | null;
  venueId: string | null;
  locationLabel: string | null;
  status: string;
}

interface VenueOption {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
}

function toDatetimeLocal(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function EditEventForm({ event, venues }: { event: EventData; venues: VenueOption[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [eventType, setEventType] = useState(event.type);
  const [isPrivate, setIsPrivate] = useState(event.isPrivate);
  const [isMajor, setIsMajor] = useState(event.isMajor);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditFormInput>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      id: event.id,
      name: event.name,
      type: event.type as EditFormInput["type"],
      status: event.status as EditFormInput["status"],
      description: event.description ?? "",
      buyIn: event.buyIn,
      maxPlayers: event.maxPlayers,
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: event.endsAt ? toDatetimeLocal(event.endsAt) : "",
      isPrivate: event.isPrivate,
      isMajor: event.isMajor,
      gtd: event.gtd ?? undefined,
      startingStack: event.startingStack ?? "",
      levelDuration: event.levelDuration ?? "",
      rebuyPolicy: event.rebuyPolicy ?? "",
      venueId: event.venueId ?? undefined,
      locationLabel: event.locationLabel ?? "",
    },
  });

  const handleTypeChange = (type: string) => {
    setEventType(type);
    setValue("type", type as EditFormInput["type"]);
  };

  const onSubmit = async (data: EditFormInput) => {
    setServerError(null);
    try {
      const result = await updateEvent({ ...data, isPrivate, isMajor });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Erro ao salvar evento");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold">Editar Evento</h1>
            <p className="tag text-text-muted mt-0.5 truncate max-w-xs">{event.name}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="tag text-text-muted hover:text-text transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-6 py-6 space-y-5">
          <input type="hidden" {...register("id")} />

          {/* Status */}
          <div>
            <label className="tag text-text-muted block mb-2">Status</label>
            <select
              {...register("status")}
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="tag text-text-muted block mb-2">Tipo de Evento</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
            <label className="tag text-text-muted block mb-2">Nome do Evento *</label>
            <input
              {...register("name")}
              type="text"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
            {errors.name && <p className="text-[11px] text-red mt-1">{errors.name.message}</p>}
          </div>

          {/* Date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tag text-text-muted block mb-2">Data e Horário *</label>
              <input
                {...register("startsAt")}
                type="datetime-local"
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
              />
              {errors.startsAt && <p className="text-[11px] text-red mt-1">{errors.startsAt.message}</p>}
            </div>
            <div>
              <label className="tag text-text-muted block mb-2">Término (opcional)</label>
              <input
                {...register("endsAt")}
                type="datetime-local"
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
              />
              <p className="text-[10px] text-text-light mt-1">Deixe em branco se não souber</p>
              {errors.endsAt && <p className="text-[11px] text-red mt-1">{errors.endsAt.message}</p>}
            </div>
          </div>

          {/* Buy-in, Max players, GTD */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="tag text-text-muted block mb-2">Buy-in (R$) *</label>
              <input
                {...register("buyIn", { valueAsNumber: true })}
                type="number"
                min={0}
                step={10}
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
              />
              {errors.buyIn && <p className="text-[11px] text-red mt-1">{errors.buyIn.message}</p>}
            </div>
            <div>
              <label className="tag text-text-muted block mb-2">Máx. Jogadores *</label>
              <input
                {...register("maxPlayers", { valueAsNumber: true })}
                type="number"
                min={2}
                max={1000}
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
              />
              {errors.maxPlayers && <p className="text-[11px] text-red mt-1">{errors.maxPlayers.message}</p>}
            </div>
            <div>
              <label className="tag text-text-muted block mb-2">GTD (R$)</label>
              <input
                {...register("gtd", {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                type="number"
                min={0}
                step={1000}
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
              />
            </div>
          </div>

          {/* Structure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tag text-text-muted block mb-2">Stack Inicial</label>
              <input
                {...register("startingStack")}
                type="text"
                placeholder="30.000 fichas"
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
              />
            </div>
            <div>
              <label className="tag text-text-muted block mb-2">Duração dos Níveis</label>
              <input
                {...register("levelDuration")}
                type="text"
                placeholder="30 minutos"
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
              />
            </div>
          </div>

          <div>
            <label className="tag text-text-muted block mb-2">Política de Re-entry</label>
            <input
              {...register("rebuyPolicy")}
              type="text"
              placeholder="Re-entry até o nível 8"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
          </div>

          {/* Venue select */}
          {venues.length > 0 && (
            <div>
              <label className="tag text-text-muted block mb-2">Casa de poker</label>
              <select
                {...register("venueId")}
                onChange={(e) => {
                  const selected = venues.find((v) => v.id === e.target.value);
                  setValue("venueId", e.target.value || undefined);
                  if (selected) {
                    setValue("lat", selected.lat);
                    setValue("lng", selected.lng);
                  } else {
                    setValue("lat", undefined);
                    setValue("lng", undefined);
                  }
                }}
                className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors"
              >
                <option value="">— Nenhuma —</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.district})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location label */}
          <div>
            <label className="tag text-text-muted block mb-2">Local (texto)</label>
            <input
              {...register("locationLabel")}
              type="text"
              placeholder="King's Poker Club — Pinheiros"
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light"
            />
          </div>

          {/* Description */}
          <div>
            <label className="tag text-text-muted block mb-2">Descrição</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Detalhes sobre o evento, estrutura, premiação..."
              className="w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors resize-none placeholder:text-text-light"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {[
              {
                label: "Evento Major",
                desc: "Destaque no mapa e calendário",
                value: isMajor,
                toggle: () => {
                  const next = !isMajor;
                  setIsMajor(next);
                  setValue("isMajor", next);
                },
              },
              {
                label: "Evento Privado",
                desc: "Inscrições precisam de aprovação",
                value: isPrivate,
                toggle: () => {
                  const next = !isPrivate;
                  setIsPrivate(next);
                  setValue("isPrivate", next);
                },
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between border border-border p-3 rounded-sm"
              >
                <div>
                  <div className="text-[13px] font-medium">{item.label}</div>
                  <div className="tag text-text-muted mt-0.5">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={item.toggle}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all duration-150 relative shrink-0",
                    item.value ? "bg-text" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-150",
                      item.value ? "left-7" : "left-1"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          {serverError && (
            <div className="text-[12px] text-red bg-red/5 border border-red/20 px-3 py-2 rounded-sm">
              {serverError}
            </div>
          )}

          {success && (
            <div className="text-[12px] text-green bg-green/5 border border-green/20 px-3 py-2 rounded-sm">
              Evento salvo! Redirecionando...
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 border border-border py-3 tag text-text-muted hover:text-text hover:border-[#B8B4AC] transition-colors rounded-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1 bg-text text-background py-3 text-[12px] font-semibold tracking-wide hover:bg-[#3A3835] active:scale-[0.98] transition-all duration-150 rounded-sm disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
