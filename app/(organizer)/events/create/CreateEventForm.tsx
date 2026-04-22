"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEvent } from "@/lib/actions/events";
import { createEventSchema, type CreateEventInput, type BlindLevel } from "@/lib/validations/event";
import { BLIND_PRESETS } from "@/lib/blind-presets";
import { cn } from "@/lib/utils";

function getDefaultStartsAt(): string {
  const now = new Date();
  const today19 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
  const target = now < today19 ? today19 : new Date(today19.getTime() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T19:00`;
}

const EVENT_TYPES = [
  { id: "TOURNAMENT", label: "Torneio" },
  { id: "CASH_GAME", label: "Cash Game" },
  { id: "HOME_GAME", label: "Home Game" },
] as const;

const GAME_STYLES = ["NLH", "PLO", "PLO Hi-Lo", "Mixed"] as const;
const LIMIT_TYPES = ["NL", "PL", "FL"] as const;
const SEATS_PRESETS = [6, 8, 9] as const;
const REBUY_LIMITS = ["unlimited", "1", "2", "custom"] as const;
const REBUY_UNTIL = ["break", "level", "time"] as const;
const ADDON_WHEN = ["first-break", "end-rebuy", "anytime"] as const;

function setNum0(v: unknown): number {
  return v === "" || v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v);
}

function setNumUndef(v: unknown): number | undefined {
  return v === "" || v === null || v === undefined || isNaN(Number(v)) ? undefined : Number(v);
}

function setNumDefault(v: unknown, defaultNum: number): number {
  return v === "" || v === null || v === undefined || isNaN(Number(v)) ? defaultNum : Number(v);
}

interface VenueOption {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
}

interface SeriesOption {
  id: string;
  name: string;
}

interface Props {
  venues: VenueOption[];
  seriesOptions: SeriesOption[];
  initialSeries?: { id: string; name: string } | null;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "w-11 h-6 rounded-full transition-all duration-150 relative shrink-0",
        value ? "bg-[#2C2A27]" : "bg-[#E2DDD6]"
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-4 h-4 rounded-full transition-all duration-150",
          value ? "left-6 bg-white" : "left-1 bg-white"
        )}
      />
    </button>
  );
}

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

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-[#E2DDD6] pb-3 last:border-0 last:pb-0">
      <div>
        <div className="text-[13px] font-medium text-[#2C2A27]">{label}</div>
        {desc && <div className="text-[11px] text-[#9C9890] mt-0.5">{desc}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export function CreateEventForm({ venues, seriesOptions, initialSeries = null }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string>("TOURNAMENT");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isMajor, setIsMajor] = useState(false);
  const [publishToCalendar, setPublishToCalendar] = useState(true);

  // Blind structure
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [blindLevels, setBlindLevels] = useState<BlindLevel[]>([]);

  // Rebuy/Addon
  const [rebuyEnabled, setRebuyEnabled] = useState(false);
  const [addonEnabled, setAddonEnabled] = useState(false);
  const [rebuyLimit, setRebuyLimit] = useState<string>("unlimited");
  const [rebuyUntil, setRebuyUntil] = useState<string>("break");
  const [addonWhen, setAddonWhen] = useState<string>("first-break");
  const [addonStackLimit, setAddonStackLimit] = useState(false);

  // Cash game
  const [blindType, setBlindType] = useState<"sb-bb" | "button">("sb-bb");
  const [straddle, setStraddle] = useState(false);
  const [showRake, setShowRake] = useState(false);
  const [hideRake, setHideRake] = useState(false);
  const [waitlistActive, setWaitlistActive] = useState(true);
  const [seatsCustom, setSeatsCustom] = useState(false);
  const [gameStyle, setGameStyle] = useState<string>("NLH");
  const [limitType, setLimitType] = useState<string>("NL");

  const defaultStartsAt = useMemo(() => getDefaultStartsAt(), []);
  const isCashGame = eventType === "CASH_GAME";
  const isTournament = eventType === "TOURNAMENT" || eventType === "HOME_GAME";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      type: "TOURNAMENT",
      isPrivate: false,
      isMajor: false,
      maxPlayers: 60,
      buyIn: 550,
      startsAt: defaultStartsAt,
      startStack: 10000,
      seriesId: initialSeries?.id,
    },
  });

  const startStack = watch("startStack") ?? 10000;
  const venueIdVal = watch("venueId");
  const seriesIdVal = watch("seriesId");

  useEffect(() => {
    if (initialSeries?.id) {
      setValue("seriesId", initialSeries.id);
      setValue("venueId", undefined);
    }
  }, [initialSeries?.id, setValue]);

  const handleTypeChange = (type: string) => {
    setEventType(type);
    setValue("type", type as CreateEventInput["type"]);
    if (type === "CASH_GAME") {
      setValue("buyIn", 0);
    }
  };

  const handleVenueChange = (venueId: string) => {
    setValue("seriesId", undefined, { shouldValidate: true });
    const selected = venues.find((v) => v.id === venueId);
    setValue("venueId", venueId || undefined, { shouldValidate: true });
    if (selected) {
      setValue("lat", selected.lat);
      setValue("lng", selected.lng);
    } else {
      setValue("lat", undefined);
      setValue("lng", undefined);
    }
  };

  const handleSeriesChange = (seriesId: string) => {
    setValue("venueId", undefined, { shouldValidate: true });
    setValue("seriesId", seriesId || undefined, { shouldValidate: true });
    setValue("lat", undefined);
    setValue("lng", undefined);
  };

  const handlePresetSelect = useCallback((presetId: string) => {
    if (selectedPreset === presetId && presetId !== "custom") {
      setSelectedPreset("custom");
      return;
    }
    setSelectedPreset(presetId);
    if (presetId !== "custom") {
      const preset = BLIND_PRESETS.find((p) => p.id === presetId);
      if (preset) setBlindLevels([...preset.levels]);
    }
  }, [selectedPreset]);

  const addLevel = () => setBlindLevels((prev) => [...prev, { type: "level", dur: 20, sb: 0, bb: 0, ante: 0 }]);
  const addBreak = () => setBlindLevels((prev) => [...prev, { type: "break", dur: 15, label: "Break" }]);
  const addLateReg = () => setBlindLevels((prev) => [...prev, { type: "latereg", dur: 15, label: "Late Registration" }]);

  const removeLevel = (idx: number) => setBlindLevels((prev) => prev.filter((_, i) => i !== idx));
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setBlindLevels((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };
  const moveDown = (idx: number) => {
    setBlindLevels((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };
  const updateLevel = (idx: number, field: string, value: string | number) => {
    setBlindLevels((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: typeof value === "string" ? (isNaN(Number(value)) ? value : Number(value)) : value } as BlindLevel;
      return next;
    });
  };

  const stats = useMemo(() => {
    const levelRows = blindLevels.filter((l) => l.type === "level");
    const totalMin = blindLevels.reduce((s, l) => s + l.dur, 0);
    const firstBb = levelRows[0]?.bb ?? 0;
    const ratio = firstBb > 0 ? Math.round(startStack / firstBb) : 0;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const durStr = h > 0 ? `${h}h ${m}min` : `${m}min`;
    return { levelCount: levelRows.length, durStr, ratio };
  }, [blindLevels, startStack]);

  const onSubmit = async (data: CreateEventInput) => {
    setServerError(null);
    try {
      const payload: CreateEventInput = {
        ...data,
        isPrivate,
        isMajor,
        blindStructure: blindLevels.length > 0 ? blindLevels : undefined,
        rebuyEnabled,
        addonEnabled,
        rebuyLimit: rebuyEnabled ? rebuyLimit : undefined,
        rebuyUntil: rebuyEnabled ? rebuyUntil : undefined,
        addonWhen: addonEnabled ? addonWhen : undefined,
        addonStackLimit: addonEnabled ? addonStackLimit : undefined,
        blindType: isCashGame ? blindType : undefined,
        hideRake: isCashGame ? hideRake : undefined,
      };

      if (isCashGame) {
        payload.buyIn = 0;
        payload.maxPlayers =
          typeof data.maxPlayers === "number" && Number.isFinite(data.maxPlayers) ? data.maxPlayers : 0;
      }

      const result = await createEvent(payload);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      router.push("/dashboard");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Erro ao criar evento");
    }
  };

  const inputCls = "w-full border border-[#E2DDD6] bg-[#F2F0EC] text-[#2C2A27] text-[13px] px-3 py-2.5 focus:border-[#B8B4AC] transition-colors placeholder:text-[#B8B4AC] outline-none";
  const segBtnCls = (active: boolean) =>
    cn(
      "flex-1 py-2 border text-[12px] font-medium transition-all",
      active
        ? "bg-[#2C2A27] text-white border-[#2C2A27]"
        : "bg-white text-[#6B6760] border-[#E2DDD6] hover:border-[#B8B4AC]"
    );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F2F0EC]">
      <div className="border-b border-[#E2DDD6] bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold text-[#2C2A27]">Criar Evento</h1>
            <p className="text-[10px] uppercase tracking-wider text-[#9C9890] mt-0.5">Novo torneio ou jogo</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-6 py-6 space-y-4">
          {initialSeries && (
            <div className="border border-[#E2DDD6] bg-white px-4 py-3 text-[12px] text-[#2C2A27]">
              <span className="text-[9px] uppercase tracking-widest text-[#9C9890] mr-2">Série</span>
              <span className="font-medium">{initialSeries.name}</span>
            </div>
          )}

          {/* Section 1 — Informações básicas */}
          <CardSection title="Informações Básicas">
            {/* Tipo */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Tipo de Evento</label>
              <div className="flex">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeChange(t.id)}
                    className={segBtnCls(eventType === t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Nome do Evento *</label>
              <input
                {...register("name")}
                type="text"
                placeholder="King's Friday Night — Main Event"
                className={inputCls}
              />
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Data e Horário *</label>
                <input
                  {...register("startsAt")}
                  type="datetime-local"
                  defaultValue={defaultStartsAt}
                  className={inputCls}
                />
                {errors.startsAt && <p className="text-[11px] text-red-600 mt-1">{errors.startsAt.message}</p>}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Término (opcional)</label>
                <input {...register("endsAt")} type="datetime-local" className={inputCls} />
              </div>
            </div>

            {/* Players + Buy-in + GTD */}
            <div className={cn("grid gap-3", isCashGame ? "grid-cols-1" : "grid-cols-3")}>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Vagas Máximas</label>
                <input
                  {...register("maxPlayers", {
                    setValueAs: (v) => setNum0(v),
                  })}
                  type="number"
                  min={0}
                  max={1000}
                  placeholder="120"
                  className={inputCls}
                />
              </div>
              {!isCashGame && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Buy-in (R$) *</label>
                  <input
                    {...register("buyIn", { setValueAs: (v) => setNum0(v) })}
                    type="number"
                    min={0}
                    step={10}
                    placeholder="550"
                    className={inputCls}
                  />
                  {errors.buyIn && <p className="text-[11px] text-red-600 mt-1">{errors.buyIn.message}</p>}
                </div>
              )}
              {!isCashGame && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">GTD (R$)</label>
                  <input
                    {...register("gtd", { setValueAs: (v) => setNumUndef(v) })}
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="50000"
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            {/* Location — série OU casa (exclusivo) */}
            {seriesOptions.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Série</label>
                <select
                  value={seriesIdVal ?? ""}
                  onChange={(e) => handleSeriesChange(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Nenhuma —</option>
                  {seriesOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {venues.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Casa de Poker</label>
                <select
                  value={venueIdVal ?? ""}
                  onChange={(e) => handleVenueChange(e.target.value)}
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

            {!seriesIdVal && !venueIdVal && (
              <p className="text-[11px] text-[#9C9890]">Avulso (sem casa ou série)</p>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Local / Bairro</label>
              <input
                {...register("locationLabel")}
                type="text"
                placeholder="Ex: Itaim Bibi, São Paulo"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Latitude (opcional)</label>
                <input
                  {...register("lat", {
                    setValueAs: (v) => setNumUndef(v),
                  })}
                  type="number"
                  step="any"
                  placeholder="-23.5505"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Longitude (opcional)</label>
                <input
                  {...register("lng", {
                    setValueAs: (v) => setNumUndef(v),
                  })}
                  type="number"
                  step="any"
                  placeholder="-46.6333"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Descrição</label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Detalhes sobre o evento..."
                className="w-full border border-[#E2DDD6] bg-[#F2F0EC] text-[#2C2A27] text-[13px] px-3 py-2.5 focus:border-[#B8B4AC] transition-colors resize-none placeholder:text-[#B8B4AC] outline-none"
              />
            </div>
          </CardSection>

          {/* Section 2 — Blind Structure (TOURNAMENT / HOME_GAME) */}
          {isTournament && (
            <CardSection title="Estrutura de Blinds">
              {/* Preset selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Preset</label>
                <div className="flex gap-2 flex-wrap">
                  {BLIND_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetSelect(p.id)}
                      className={cn(
                        "px-3 py-1.5 border text-[12px] font-medium transition-all",
                        selectedPreset === p.id
                          ? "bg-[#2C2A27] text-white border-[#2C2A27]"
                          : "bg-white text-[#6B6760] border-[#E2DDD6] hover:border-[#B8B4AC]"
                      )}
                    >
                      {p.label}
                      <span className="ml-1 text-[10px] opacity-60">{p.sublabel}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedPreset("custom")}
                    className={cn(
                      "px-3 py-1.5 border text-[12px] font-medium transition-all",
                      selectedPreset === "custom"
                        ? "bg-[#2C2A27] text-white border-[#2C2A27]"
                        : "bg-white text-[#6B6760] border-[#E2DDD6] hover:border-[#B8B4AC]"
                    )}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Stats strip */}
              {blindLevels.length > 0 && (
                <div className="bg-[#2C2A27] text-white px-4 py-2.5 flex gap-6 text-[12px]">
                  <span><span className="font-cormorant italic text-base">{stats.levelCount}</span> níveis</span>
                  <span><span className="font-cormorant italic text-base">{stats.durStr}</span> estimados</span>
                  {stats.ratio > 0 && (
                    <span>Stack <span className="font-cormorant italic text-base">{stats.ratio}bb</span></span>
                  )}
                </div>
              )}

              {/* Blind levels table */}
              {blindLevels.length > 0 && (
                <div className="border border-[#E2DDD6] overflow-hidden">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-[#2C2A27] text-white">
                        <th className="px-2 py-2 text-left w-8">#</th>
                        <th className="px-2 py-2 text-left">SB</th>
                        <th className="px-2 py-2 text-left">BB</th>
                        <th className="px-2 py-2 text-left">Ante</th>
                        <th className="px-2 py-2 text-left">Min</th>
                        <th className="px-2 py-2 text-center w-20">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blindLevels.map((row, idx) => {
                        const isBreak = row.type === "break";
                        const isLateReg = row.type === "latereg";
                        const levelNum = blindLevels.slice(0, idx + 1).filter((l) => l.type === "level").length;
                        return (
                          <tr
                            key={idx}
                            className={cn(
                              "border-b border-[#E2DDD6] last:border-0",
                              isBreak && "bg-[#F5F4F1]",
                              isLateReg && "bg-[#F0FFF4]"
                            )}
                          >
                            <td className="px-2 py-1.5 text-[#9C9890]">
                              {row.type === "level" ? levelNum : (isBreak ? "B" : "LR")}
                            </td>
                            {(isBreak || isLateReg) ? (
                              <>
                                <td colSpan={3} className="px-2 py-1.5">
                                  <input
                                    type="text"
                                    value={row.label ?? ""}
                                    onChange={(e) => updateLevel(idx, "label", e.target.value)}
                                    className="w-full bg-transparent text-[#2C2A27] outline-none"
                                    placeholder={isBreak ? "Break" : "Late Registration"}
                                  />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="number"
                                    value={row.sb ?? ""}
                                    onChange={(e) => updateLevel(idx, "sb", e.target.value)}
                                    className="w-16 bg-transparent text-[#2C2A27] outline-none border-b border-[#E2DDD6]"
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="number"
                                    value={row.bb ?? ""}
                                    onChange={(e) => updateLevel(idx, "bb", e.target.value)}
                                    className="w-16 bg-transparent text-[#2C2A27] outline-none border-b border-[#E2DDD6]"
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="number"
                                    value={row.ante ?? ""}
                                    onChange={(e) => updateLevel(idx, "ante", e.target.value)}
                                    className="w-16 bg-transparent text-[#2C2A27] outline-none border-b border-[#E2DDD6]"
                                  />
                                </td>
                              </>
                            )}
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                value={row.dur}
                                onChange={(e) => updateLevel(idx, "dur", e.target.value)}
                                className="w-12 bg-transparent text-[#2C2A27] outline-none border-b border-[#E2DDD6]"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex gap-1 justify-center">
                                <button type="button" onClick={() => moveUp(idx)} className="px-1 text-[#9C9890] hover:text-[#2C2A27]">↑</button>
                                <button type="button" onClick={() => moveDown(idx)} className="px-1 text-[#9C9890] hover:text-[#2C2A27]">↓</button>
                                <button type="button" onClick={() => removeLevel(idx)} className="px-1 text-[#9C9890] hover:text-red-600">×</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={addLevel} className="px-3 py-1.5 border border-[#E2DDD6] text-[12px] text-[#6B6760] hover:border-[#B8B4AC] transition-colors">
                  + Nível
                </button>
                <button type="button" onClick={addBreak} className="px-3 py-1.5 border border-[#E2DDD6] text-[12px] text-[#6B6760] hover:border-[#B8B4AC] transition-colors">
                  + Break
                </button>
                <button type="button" onClick={addLateReg} className="px-3 py-1.5 border border-[#E2DDD6] text-[12px] text-[#6B6760] hover:border-[#B8B4AC] transition-colors">
                  + Late Reg
                </button>
              </div>

              {/* Stack settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Stack Inicial</label>
                  <input
                    {...register("startStack", { setValueAs: (v) => setNum0(v) })}
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="10000"
                    className={inputCls}
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <div className="flex gap-1.5 items-center">
                    {["#FFFFFF", "#EF4444", "#3B82F6", "#22C55E", "#1C1917"].map((color) => (
                      <div
                        key={color}
                        className="w-6 h-6 rounded-full border border-[#E2DDD6]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardSection>
          )}

          {/* Section 3 — Rebuy & Add-on (TOURNAMENT only) */}
          {isTournament && (
            <CardSection title="Rebuy & Add-on">
              <ToggleRow
                label="Rebuy"
                desc="Permite re-entrada durante o torneio"
                value={rebuyEnabled}
                onChange={setRebuyEnabled}
              />
              {rebuyEnabled && (
                <div className="space-y-3 pl-0 border-l-2 border-[#E2DDD6] pl-4 ml-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Stack do Rebuy</label>
                      <input
                        {...register("rebuyStack", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        placeholder="10000"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Preço do Rebuy (R$)</label>
                      <input
                        {...register("rebuyPrice", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        placeholder="200"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Limite</label>
                    <div className="flex">
                      {(["unlimited", "1", "2", "custom"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRebuyLimit(v)}
                          className={segBtnCls(rebuyLimit === v)}
                        >
                          {v === "unlimited" ? "Ilimitado" : v === "custom" ? "Personalizado" : `${v}x`}
                        </button>
                      ))}
                    </div>
                  </div>
                  {rebuyLimit === "custom" && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Quantidade</label>
                      <input
                        {...register("rebuyLimitCustom", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        min={1}
                        placeholder="3"
                        className={inputCls}
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Válido até</label>
                    <div className="flex">
                      {(["break", "level", "time"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRebuyUntil(v)}
                          className={segBtnCls(rebuyUntil === v)}
                        >
                          {v === "break" ? "Primeiro break" : v === "level" ? "Nível X" : "Tempo fixo"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {rebuyUntil === "level" && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Até o Nível</label>
                      <input
                        {...register("rebuyUntilLevel", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        min={1}
                        placeholder="6"
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              )}

              <ToggleRow
                label="Add-on"
                desc="Permite compra adicional de fichas"
                value={addonEnabled}
                onChange={setAddonEnabled}
              />
              {addonEnabled && (
                <div className="space-y-3 border-l-2 border-[#E2DDD6] pl-4 ml-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Stack do Add-on</label>
                      <input
                        {...register("addonStack", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        placeholder="10000"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Preço do Add-on (R$)</label>
                      <input
                        {...register("addonPrice", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        placeholder="200"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Quando</label>
                    <div className="flex">
                      {(["first-break", "end-rebuy", "anytime"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAddonWhen(v)}
                          className={segBtnCls(addonWhen === v)}
                        >
                          {v === "first-break" ? "1º Break" : v === "end-rebuy" ? "Fim rebuy" : "A qualquer momento"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ToggleRow
                    label="Limite de stack"
                    desc="Disponível apenas se stack ≤ X"
                    value={addonStackLimit}
                    onChange={setAddonStackLimit}
                  />
                  {addonStackLimit && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Limite (fichas)</label>
                      <input
                        {...register("addonStackLimitVal", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        placeholder="10000"
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardSection>
          )}

          {/* Section 2 (Cash Game) — Configuração do Jogo */}
          {isCashGame && (
            <CardSection title="Configuração do Jogo">
              {/* Blind type */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Tipo de Blind</label>
                <div className="flex">
                  <button type="button" onClick={() => setBlindType("sb-bb")} className={segBtnCls(blindType === "sb-bb")}>
                    SB / BB
                  </button>
                  <button type="button" onClick={() => setBlindType("button")} className={segBtnCls(blindType === "button")}>
                    Button Blind
                  </button>
                </div>
              </div>

              {blindType === "sb-bb" ? (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">SB / BB</label>
                    <div className="flex items-center gap-2">
                      <input
                        {...register("sbValue", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="1"
                        className={cn(inputCls, "flex-1")}
                      />
                      <span className="text-[#9C9890] font-medium">/</span>
                      <input
                        {...register("bbValue", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="2"
                        className={cn(inputCls, "flex-1")}
                      />
                    </div>
                  </div>
                  <ToggleRow
                    label="Straddle"
                    value={straddle}
                    onChange={setStraddle}
                  />
                  {straddle && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Valor do Straddle</label>
                      <input
                        {...register("straddleValue", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="4"
                        className={inputCls}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Button Blind</label>
                    <input
                      {...register("btnValue", { setValueAs: (v) => setNumUndef(v) })}
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="2"
                      className={inputCls}
                    />
                  </div>
                  <ToggleRow
                    label="Straddle"
                    value={straddle}
                    onChange={setStraddle}
                  />
                  {straddle && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Valor do Straddle</label>
                      <input
                        {...register("straddleValue", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        min={0}
                        placeholder="4"
                        className={inputCls}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Game style */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Modalidade</label>
                <div className="flex">
                  {GAME_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setGameStyle(s)}
                      className={segBtnCls(gameStyle === s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limit */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Limite</label>
                <div className="flex">
                  {LIMIT_TYPES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLimitType(l)}
                      className={segBtnCls(limitType === l)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buy-in range */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Buy-in</label>
                <div className="flex items-center gap-2">
                  <input
                    {...register("buyinMin", { setValueAs: (v) => setNumUndef(v) })}
                    type="number"
                    min={0}
                    placeholder="Min"
                    className={cn(inputCls, "flex-1")}
                  />
                  <span className="text-[#9C9890] font-medium">–</span>
                  <input
                    {...register("buyinMax", { setValueAs: (v) => setNumUndef(v) })}
                    type="number"
                    min={0}
                    placeholder="Max"
                    className={cn(inputCls, "flex-1")}
                  />
                </div>
              </div>

              {/* Table setup */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Mesas</label>
                  <input
                    {...register("tableCount", { setValueAs: (v) => setNumDefault(v, 1) })}
                    type="number"
                    min={1}
                    max={20}
                    placeholder="1"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Lugares por Mesa</label>
                  {!seatsCustom ? (
                    <div className="flex gap-1">
                      {SEATS_PRESETS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setValue("seatsPerTable", s); }}
                          className={cn(
                            "flex-1 py-2.5 border text-[12px] font-medium transition-all",
                            watch("seatsPerTable") === s
                              ? "bg-[#2C2A27] text-white border-[#2C2A27]"
                              : "bg-white text-[#6B6760] border-[#E2DDD6]"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSeatsCustom(true)}
                        className="flex-1 py-2.5 border text-[12px] font-medium border-[#E2DDD6] text-[#6B6760]"
                      >
                        outro
                      </button>
                    </div>
                  ) : (
                    <input
                      {...register("seatsPerTable", { setValueAs: (v) => setNumDefault(v, 9) })}
                      type="number"
                      min={2}
                      max={12}
                      placeholder="9"
                      className={inputCls}
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </CardSection>
          )}

          {/* Section 3 (Cash Game) — Rake */}
          {isCashGame && (
            <CardSection title="Rake">
              <ToggleRow
                label="Mostrar rake"
                desc="Exibe informações de rake para os jogadores"
                value={showRake}
                onChange={setShowRake}
              />
              {showRake && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Rake %</label>
                      <input
                        {...register("rake", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        placeholder="5"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#9C9890] block mb-2">Cap (R$)</label>
                      <input
                        {...register("rakeCap", { setValueAs: (v) => setNumUndef(v) })}
                        type="number"
                        min={0}
                        placeholder="20"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <ToggleRow
                    label="Ocultar rake dos jogadores"
                    value={hideRake}
                    onChange={setHideRake}
                  />
                </div>
              )}
            </CardSection>
          )}

          {/* Section 4 (Cash Game) — Waitlist */}
          {isCashGame && (
            <CardSection title="Lista de Espera">
              <ToggleRow
                label="Lista de espera ativa"
                desc="Jogadores podem entrar na fila pelo app"
                value={waitlistActive}
                onChange={setWaitlistActive}
              />
            </CardSection>
          )}

          {/* Section 4 — Configurações gerais */}
          <CardSection title="Configurações">
            <ToggleRow
              label="Evento Major"
              desc="Destaque no mapa e calendário"
              value={isMajor}
              onChange={(v) => { setIsMajor(v); setValue("isMajor", v); }}
            />
            <ToggleRow
              label="Evento Privado"
              desc="Inscrições precisam de aprovação"
              value={isPrivate}
              onChange={(v) => { setIsPrivate(v); setValue("isPrivate", v); }}
            />
            <ToggleRow
              label="Publicar no Calendário Nacional"
              desc="Visível no feed de todos os jogadores"
              value={publishToCalendar}
              onChange={setPublishToCalendar}
            />
          </CardSection>

          {serverError && (
            <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 px-3 py-2">
              {serverError}
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 px-3 py-2 space-y-0.5">
              <p className="font-medium mb-1">Corrija os erros abaixo:</p>
              {Object.entries(errors).map(([field, err]) => {
                const fe = err as FieldError | undefined;
                return (
                  <p key={field}>
                    • {field}: {fe?.message ?? "inválido"}
                  </p>
                );
              })}
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
              className="flex-1 bg-[#2C2A27] text-white py-3 text-[12px] font-semibold tracking-wide hover:bg-[#3A3835] active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
            >
              {isSubmitting ? "Criando..." : "Publicar Evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
