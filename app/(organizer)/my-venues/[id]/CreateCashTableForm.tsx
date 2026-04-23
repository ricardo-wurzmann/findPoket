"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCashTable } from "@/lib/actions/cashTables";
import { cn } from "@/lib/utils";

const VARIANTS = ["NLH", "PLO", "PLO Hi-Lo", "Mixed"] as const;
const BLIND_TYPES = [
  { value: "sb-bb", label: "SB / BB" },
  { value: "button", label: "Button" },
] as const;

interface Props {
  venueId: string;
  onCreated?: () => void;
}

function parseOptionalFloat(s: string): number | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalInt(s: string): number | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}

export function CreateCashTableForm({ venueId, onCreated }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>("NLH");
  const [blindType, setBlindType] = useState<(typeof BLIND_TYPES)[number]["value"]>("sb-bb");
  const [sb, setSb] = useState("");
  const [bb, setBb] = useState("");
  const [btn, setBtn] = useState("");
  const [buyinMin, setBuyinMin] = useState("");
  const [buyinMax, setBuyinMax] = useState("");
  const [seats, setSeats] = useState("9");
  const [notes, setNotes] = useState("");

  const inputCls =
    "w-full border border-border bg-background text-text text-[13px] px-3 py-2.5 rounded-sm focus:border-[#B8B4AC] outline-none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sbValue = parseOptionalFloat(sb);
    const bbValue = parseOptionalFloat(bb);
    const btnValue = parseOptionalFloat(btn);
    const buyMin = parseOptionalFloat(buyinMin);
    const buyMax = parseOptionalFloat(buyinMax);
    const seatsNum = parseOptionalInt(seats) ?? 9;

    const result = await createCashTable({
      venueId,
      name: name.trim(),
      variant,
      blindType,
      ...(blindType === "sb-bb"
        ? { sbValue: sbValue ?? 0, bbValue: bbValue ?? 0 }
        : { btnValue: btnValue ?? 0 }),
      ...(buyMin != null ? { buyinMin: buyMin } : {}),
      ...(buyMax != null ? { buyinMax: buyMax } : {}),
      seats: seatsNum,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });

    if (result?.serverError) {
      setError(result.serverError);
      setLoading(false);
      return;
    }
    setName("");
    setSb("");
    setBb("");
    setBtn("");
    setBuyinMin("");
    setBuyinMax("");
    setSeats("9");
    setNotes("");
    setLoading(false);
    router.refresh();
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-sm p-4 space-y-3 bg-background">
      <div className="text-[12px] font-semibold">Adicionar Mesa</div>
      <div>
        <label className="tag text-text-muted block mb-1">Nome</label>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="tag text-text-muted block mb-1">Variante</label>
          <select className={cn(inputCls, "cursor-pointer")} value={variant} onChange={(e) => setVariant(e.target.value as (typeof VARIANTS)[number])}>
            {VARIANTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="tag text-text-muted block mb-1">Tipo de blind</label>
          <select
            className={cn(inputCls, "cursor-pointer")}
            value={blindType}
            onChange={(e) => setBlindType(e.target.value as (typeof BLIND_TYPES)[number]["value"])}
          >
            {BLIND_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {blindType === "sb-bb" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="tag text-text-muted block mb-1">SB</label>
            <input className={inputCls} inputMode="decimal" value={sb} onChange={(e) => setSb(e.target.value)} />
          </div>
          <div>
            <label className="tag text-text-muted block mb-1">BB</label>
            <input className={inputCls} inputMode="decimal" value={bb} onChange={(e) => setBb(e.target.value)} />
          </div>
        </div>
      ) : (
        <div>
          <label className="tag text-text-muted block mb-1">Valor button</label>
          <input className={inputCls} inputMode="decimal" value={btn} onChange={(e) => setBtn(e.target.value)} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="tag text-text-muted block mb-1">Buy-in mín</label>
          <input className={inputCls} inputMode="decimal" value={buyinMin} onChange={(e) => setBuyinMin(e.target.value)} />
        </div>
        <div>
          <label className="tag text-text-muted block mb-1">Buy-in máx</label>
          <input className={inputCls} inputMode="decimal" value={buyinMax} onChange={(e) => setBuyinMax(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="tag text-text-muted block mb-1">Lugares</label>
        <input className={inputCls} inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} min={2} max={20} />
      </div>
      <div>
        <label className="tag text-text-muted block mb-1">Notas</label>
        <textarea className={cn(inputCls, "min-h-[72px] resize-y")} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
      </div>
      {error && <p className="text-[11px] text-red">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="tag bg-text text-background px-4 py-2 rounded-sm hover:bg-[#3A3835] transition-colors disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Criar mesa"}
      </button>
    </form>
  );
}
