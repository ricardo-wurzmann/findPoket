"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CashTable } from "@prisma/client";
import { toggleCashTable, deleteCashTable } from "@/lib/actions/cashTables";
import { formatCashTableBlinds, formatCashTableBuyinRange } from "@/lib/cash-table-display";
import { CreateCashTableForm } from "./CreateCashTableForm";
import { cn } from "@/lib/utils";

interface Props {
  venueId: string;
  initialTables: CashTable[];
}

export function OrganizerCashTablesClient({ venueId, initialTables }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleToggle = async (t: CashTable) => {
    setBusyId(t.id);
    try {
      const res = await toggleCashTable({ id: t.id, isActive: !t.isActive });
      if (res?.serverError) {
        alert(res.serverError);
      } else {
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta mesa?")) return;
    setBusyId(id);
    try {
      const res = await deleteCashTable({ id });
      if (res?.serverError) {
        alert(res.serverError);
      } else {
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="border border-border rounded-sm overflow-hidden mb-8">
      <div className="px-5 py-4 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold">Mesas de Cash Game</h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="tag border border-border px-3 py-1.5 rounded-sm hover:border-[#B8B4AC] transition-colors"
        >
          {showForm ? "Fechar formulário" : "+ Nova Mesa"}
        </button>
      </div>
      <div className="px-5 py-5 space-y-4">
        {showForm && (
          <CreateCashTableForm
            venueId={venueId}
            onCreated={() => {
              setShowForm(false);
            }}
          />
        )}

        {initialTables.length === 0 ? (
          <p className="tag text-text-muted">Nenhuma mesa cadastrada.</p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-sm">
            {initialTables.map((t) => (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-surface transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium">{t.name}</span>
                    <span className="tag border border-border px-1.5 py-0.5 rounded-sm text-[10px]">{t.variant}</span>
                    {!t.isActive && (
                      <span className="tag text-text-muted border border-border px-1.5 py-0.5 rounded-sm text-[10px]">Inativa</span>
                    )}
                  </div>
                  <div className="tag text-text-muted mt-1">
                    {formatCashTableBlinds(t)} · {formatCashTableBuyinRange(t.buyinMin, t.buyinMax)} · {t.seats} lugares
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => handleToggle(t)}
                    className={cn(
                      "tag px-3 py-1.5 rounded-sm border transition-colors",
                      t.isActive ? "border-amber/40 text-amber" : "border-green/40 text-green"
                    )}
                  >
                    {busyId === t.id ? "…" : t.isActive ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => handleDelete(t.id)}
                    className="tag px-3 py-1.5 rounded-sm border border-red/30 text-red hover:border-red transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
