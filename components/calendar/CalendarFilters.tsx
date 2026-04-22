"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type CalendarAppliedFilters = {
  buyInMin: number | null;
  buyInMax: number | null;
  gtdMin: number | null;
  gtdMax: number | null;
  venueId: string | null;
  seriesId: string | null;
};

export const emptyCalendarFilters: CalendarAppliedFilters = {
  buyInMin: null,
  buyInMax: null,
  gtdMin: null,
  gtdMax: null,
  venueId: null,
  seriesId: null,
};

type VenueOpt = { id: string; name: string; city: string; district: string };
type SeriesOpt = { id: string; name: string };

interface CalendarFiltersProps {
  venues: VenueOpt[];
  series: SeriesOpt[];
  applied: CalendarAppliedFilters;
  onApply: (next: CalendarAppliedFilters) => void;
  onClear: () => void;
}

function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function CalendarFilters({ venues, series, applied, onApply, onClear }: CalendarFiltersProps) {
  const [open, setOpen] = useState(false);
  const [buyInMin, setBuyInMin] = useState("");
  const [buyInMax, setBuyInMax] = useState("");
  const [gtdMin, setGtdMin] = useState("");
  const [gtdMax, setGtdMax] = useState("");
  const [venueId, setVenueId] = useState("");
  const [seriesId, setSeriesId] = useState("");

  useEffect(() => {
    setBuyInMin(applied.buyInMin != null ? String(applied.buyInMin) : "");
    setBuyInMax(applied.buyInMax != null ? String(applied.buyInMax) : "");
    setGtdMin(applied.gtdMin != null ? String(applied.gtdMin) : "");
    setGtdMax(applied.gtdMax != null ? String(applied.gtdMax) : "");
    setVenueId(applied.venueId ?? "");
    setSeriesId(applied.seriesId ?? "");
  }, [applied]);

  const inputCls =
    "w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 focus:border-[#B8B4AC] transition-colors outline-none rounded-sm";

  const handleApply = () => {
    onApply({
      buyInMin: parseNum(buyInMin),
      buyInMax: parseNum(buyInMax),
      gtdMin: parseNum(gtdMin),
      gtdMax: parseNum(gtdMax),
      venueId: venueId || null,
      seriesId: seriesId || null,
    });
  };

  const handleClear = () => {
    setBuyInMin("");
    setBuyInMax("");
    setGtdMin("");
    setGtdMax("");
    setVenueId("");
    setSeriesId("");
    onClear();
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tag border border-border px-3 py-2 rounded-sm bg-background hover:border-[#B8B4AC] transition-colors"
      >
        Filtros {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="mt-3 border border-border bg-background rounded-sm p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tag text-text-muted block mb-1.5">Buy-in mín (R$)</label>
              <input
                type="number"
                min={0}
                value={buyInMin}
                onChange={(e) => setBuyInMin(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="tag text-text-muted block mb-1.5">Buy-in máx (R$)</label>
              <input
                type="number"
                min={0}
                value={buyInMax}
                onChange={(e) => setBuyInMax(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="tag text-text-muted block mb-1.5">GTD mín (R$)</label>
              <input
                type="number"
                min={0}
                value={gtdMin}
                onChange={(e) => setGtdMin(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="tag text-text-muted block mb-1.5">GTD máx (R$)</label>
              <input
                type="number"
                min={0}
                value={gtdMax}
                onChange={(e) => setGtdMax(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="tag text-text-muted block mb-1.5">Casa</label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className={cn(inputCls, "cursor-pointer")}
              >
                <option value="">Todas</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="tag text-text-muted block mb-1.5">Série</label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className={cn(inputCls, "cursor-pointer")}
              >
                <option value="">Todas</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleApply}
              className="tag bg-text text-background px-4 py-2 rounded-sm hover:bg-[#3A3835] transition-colors"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="tag border border-border px-4 py-2 rounded-sm hover:border-[#B8B4AC] transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
