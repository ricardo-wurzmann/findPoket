"use client";

import { useState } from "react";
import { callNextInWaitlist, markSeated, removeFromWaitlist } from "@/lib/actions/waitlist";
import { cn } from "@/lib/utils";

type WaitlistStatus = "WAITING" | "CALLED" | "SEATED" | "LEFT";

interface WaitlistEntry {
  id: string;
  name: string;
  createdAt: Date;
  calledAt: Date | null;
  status: WaitlistStatus;
  user: {
    id: string;
    name: string;
    handle: string | null;
    avatarUrl: string | null;
  } | null;
}

interface Props {
  eventId: string;
  initialEntries: WaitlistEntry[];
}

const STATUS_LABEL: Record<WaitlistStatus, string> = {
  WAITING: "Aguardando",
  CALLED: "Chamado",
  SEATED: "Sentado",
  LEFT: "Saiu",
};

const STATUS_COLOR: Record<WaitlistStatus, string> = {
  WAITING: "text-amber-600 bg-amber-50 border-amber-200",
  CALLED: "text-green-600 bg-green-50 border-green-200 animate-pulse",
  SEATED: "text-[#9C9890] bg-[#F2F0EC] border-[#E2DDD6]",
  LEFT: "text-red-400 bg-red-50 border-red-100 opacity-60",
};

function formatTime(d: Date) {
  const date = new Date(d);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(d: Date) {
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h atrás`;
}

export function WaitlistPanel({ eventId, initialEntries }: Props) {
  const [entries, setEntries] = useState<WaitlistEntry[]>(initialEntries);
  const [loading, setLoading] = useState<string | null>(null);

  const waiting = entries.filter((e) => e.status === "WAITING").length;
  const called = entries.filter((e) => e.status === "CALLED").length;

  const handleCall = async (id: string) => {
    setLoading(id);
    try {
      const result = await callNextInWaitlist({ waitlistId: id });
      if (result?.data?.entry) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "CALLED", calledAt: result.data!.entry.calledAt } : e))
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSeat = async (id: string) => {
    setLoading(id);
    try {
      const result = await markSeated({ waitlistId: id });
      if (result?.data?.entry) {
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "SEATED" } : e)));
      }
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (id: string) => {
    setLoading(id);
    try {
      const result = await removeFromWaitlist({ waitlistId: id });
      if (result?.data?.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Summary */}
      <div className="flex gap-3">
        <div className="border border-[#E2DDD6] bg-white px-4 py-3 flex-1 text-center">
          <div className="font-cormorant italic text-2xl text-amber-600">{waiting}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#9C9890] mt-0.5">Aguardando</div>
        </div>
        <div className="border border-[#E2DDD6] bg-white px-4 py-3 flex-1 text-center">
          <div className="font-cormorant italic text-2xl text-green-600">{called}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#9C9890] mt-0.5">Chamados</div>
        </div>
        <div className="border border-[#E2DDD6] bg-white px-4 py-3 flex-1 text-center">
          <div className="font-cormorant italic text-2xl text-[#2C2A27]">{entries.filter((e) => e.status === "SEATED").length}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#9C9890] mt-0.5">Sentados</div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="border border-[#E2DDD6] bg-white p-8 text-center">
          <p className="text-[13px] text-[#9C9890]">Nenhum jogador na lista de espera.</p>
        </div>
      ) : (
        <div className="border border-[#E2DDD6] bg-white divide-y divide-[#E2DDD6]">
          {entries.map((entry, idx) => {
            const pos = entries.slice(0, idx + 1).filter((e) => e.status === "WAITING").length;
            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-4 px-4 py-3",
                  entry.status === "LEFT" && "opacity-50",
                  entry.status === "SEATED" && "opacity-70"
                )}
              >
                {/* Position */}
                <div className="w-7 text-center">
                  {entry.status === "WAITING" && (
                    <span className="font-cormorant italic text-lg text-[#2C2A27]">{pos}</span>
                  )}
                </div>

                {/* Avatar placeholder */}
                <div className="w-8 h-8 rounded-full bg-[#E2DDD6] flex items-center justify-center text-[11px] font-semibold text-[#6B6760] shrink-0">
                  {entry.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + time */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#2C2A27] truncate">
                    {entry.user?.name ?? entry.name}
                    {entry.user?.handle && (
                      <span className="text-[11px] text-[#9C9890] ml-1.5">@{entry.user.handle}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#9C9890]">
                    Entrou {formatRelative(entry.createdAt)}
                    {entry.calledAt && ` · Chamado ${formatTime(entry.calledAt)}`}
                  </div>
                </div>

                {/* Status badge */}
                <span className={cn("px-2 py-0.5 border text-[10px] font-medium shrink-0", STATUS_COLOR[entry.status])}>
                  {STATUS_LABEL[entry.status]}
                </span>

                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                  {entry.status === "WAITING" && (
                    <button
                      onClick={() => handleCall(entry.id)}
                      disabled={loading === entry.id}
                      className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      Chamar
                    </button>
                  )}
                  {entry.status === "CALLED" && (
                    <button
                      onClick={() => handleSeat(entry.id)}
                      disabled={loading === entry.id}
                      className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-[11px] font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      Sentar
                    </button>
                  )}
                  {(entry.status === "WAITING" || entry.status === "CALLED") && (
                    <button
                      onClick={() => handleRemove(entry.id)}
                      disabled={loading === entry.id}
                      className="px-2.5 py-1 border border-[#E2DDD6] text-[#9C9890] text-[11px] hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
