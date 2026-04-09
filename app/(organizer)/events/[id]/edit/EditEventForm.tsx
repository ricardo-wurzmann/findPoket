"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateEvent } from "@/lib/actions/events";
import { updateEventSchema } from "@/lib/validations/event";
import { cn } from "@/lib/utils";

const editFormSchema = updateEventSchema.extend({ id: z.string() });
type EditFormInput = z.infer<typeof editFormSchema>;

const EVENT_TYPES = [
  { id: "TOURNAMENT", label: "Torneio" },
  { id: "CASH_GAME", label: "Cash Game" },
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
  blinds: string | null;
  venueId: string | null;
  lat: number | null;
  lng: number | null;
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

  const isCashGame = eventType === "CASH_GAME";

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
      blinds: event.blinds ?? "",
      venueId: event.venueId ?? undefined,
      lat: event.lat ?? undefined,
      lng: event.lng ?? undefined,
      locationLabel: event.locationLabel ?? "",
    },
  });

  const handleTypeChange = (type: string) => {
    setEventType(type);
    setValue("type", type as EditFormInput["type"]);
    if (type === "CASH_GAME") {
      setValue("buyIn", 0);
      setValue("startingStack", undefined);
      setValue("levelDuration", undefined);
      setValue("rebuyPolicy", undefined);
    }
  };

  const onSubmit = async (data: EditFormInput) => {
    setServerError(null);
    try {
      const payload: EditFormInput = { ...data, isPrivate, isMajor };
      if (isCashGame) {
        payload.buyIn = 0;
        payload.startingStack = undefined;
        payload.levelDuration = undefined;
        payload.rebuyPolicy = undefined;
      }
      const result = await updateEvent({ ...payload, isPrivate, isMajor });
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

  const inputCls = "w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] transition-colors placeholder:text-text-light";

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
              className={inputCls}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="tag text-text-muted block mb-2">Tipo de Evento</label>
            <div className="grid grid-cols-3 gap-2">
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
              className={inputCls}
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
                className={inputCls}
              />
              {errors.startsAt && <p className="text-[11px] text-red mt-1">{errors.startsAt.message}</p>}
            </div>
            <div>
              <label className="tag text-text-muted block mb-2">Término (opcional)</label>
              <input
                {...register("endsAt")}
                type="datetime-local"
                className={inputCls}
              />
              <p className="text-[10px] text-text-light mt-1">Deixe em branco se não souber</p>
            </div>
          </div>

          {/* Buy-in, Max players, GTD */}
          <div className={cn("grid gap-3", isCashGame ? "grid-cols-1" : "grid-cols-3")}>
            {!isCashGame && (
              <div>
                <label className="tag text-text-muted block mb-2">Buy-in (R$) *</label>
                <input
                  {...register("buyIn", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step={10}
                  className={inputCls}
                />
                {errors.buyIn && <p className="text-[11px] text-red mt-1">{errors.buyIn.message}</p>}
              </div>
            )}
            <div>
              <label className="tag text-text-muted block mb-2">Máx. Jogadores *</label>
              <input
                {...register("maxPlayers", { valueAsNumber: true })}
                type="number"
                min={2}
                max={1000}
                className={inputCls}
              />
              {errors.maxPlayers && <p className="text-[11px] text-red mt-1">{errors.maxPlayers.message}</p>}
            </div>
            {!isCashGame && (
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
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Cash Game: Blinds */}
          {isCashGame && (
            <div>
              <label className="tag text-text-muted block mb-2">Blinds</label>
              <input
                {...register("blinds")}
                type="text"
                placeholder="Ex: 1/2, 2/5, 5/10"
                className={inputCls}
              />
            </div>
          )}

          {/* Tournament/HomeGame: Structure */}
          {!isCashGame && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="tag text-text-muted block mb-2">Stack Inicial</label>
                  <input
                    {...register("startingStack")}
                    type="text"
                    placeholder="30.000 fichas"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="tag text-text-muted block mb-2">Duração dos Níveis</label>
                  <input
                    {...register("levelDuration")}
                    type="text"
                    placeholder="30 minutos"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="tag text-text-muted block mb-2">Política de Re-entry</label>
                <input
                  {...register("rebuyPolicy")}
                  type="text"
                  placeholder="Re-entry até o nível 8"
                  className={inputCls}
                />
              </div>
            </>
          )}

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
                className={inputCls}
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

          {/* Location label + coordinates */}
          <div className="border border-border rounded-sm p-4 space-y-4">
            <div className="tag text-text-muted">Localização</div>

            <div>
              <label className="tag text-text-muted block mb-2">Bairro / Local</label>
              <input
                {...register("locationLabel")}
                type="text"
                placeholder="Ex: Itaim Bibi, São Paulo"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="tag text-text-muted block mb-2">Latitude (opcional)</label>
                <input
                  {...register("lat", {
                    setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
                  })}
                  type="number"
                  step="any"
                  placeholder="Ex: -23.5505"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="tag text-text-muted block mb-2">Longitude (opcional)</label>
                <input
                  {...register("lng", {
                    setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
                  })}
                  type="number"
                  step="any"
                  placeholder="Ex: -46.6333"
                  className={inputCls}
                />
              </div>
            </div>
            <p className="text-[10px] text-text-light -mt-2">
              Para aparecer no mapa. Em SP: lat -23.55, lng -46.63
            </p>
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
