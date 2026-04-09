"use client";

import { useState, useEffect } from "react";
import { approveRegistration, denyRegistration } from "@/lib/actions/registrations";
import { formatDate, formatTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PendingRegistration {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    handle: string | null;
    email: string;
  };
  event: {
    id: string;
    name: string;
    startsAt: string;
  };
}

export default function RequestsPage() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await fetch("/api/organizer/requests");
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data.registrations);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveRegistration({ id });
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (id: string) => {
    setProcessingId(id);
    try {
      await denyRegistration({ id });
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-5">
        <h1 className="text-[15px] font-semibold">Interesses Declarados</h1>
        <p className="tag text-text-muted mt-0.5">
          {loading ? "Carregando..." : `${registrations.length} interesses aguardando confirmação`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-border h-16 bg-surface animate-pulse rounded-sm" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted border border-border rounded-sm">
            <span className="text-3xl mb-2 opacity-20">◉</span>
            <p className="tag">Nenhum interesse pendente</p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-sm">
            {registrations.map((reg) => {
              const isProcessing = processingId === reg.id;
              return (
                <div
                  key={reg.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 transition-all duration-150",
                    isProcessing && "opacity-50"
                  )}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-sidebar border border-sidebar-border rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-white">
                      {getInitials(reg.user.name)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{reg.user.name}</div>
                    <div className="tag text-text-muted mt-0.5">
                      {reg.user.handle ? `@${reg.user.handle} · ` : ""}{reg.event.name}
                    </div>
                    <div className="tag text-text-muted">
                      {formatDate(reg.event.startsAt)} às {formatTime(reg.event.startsAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(reg.id)}
                      disabled={isProcessing}
                      className="tag text-green border border-green/30 hover:border-green hover:bg-green/5 px-3 py-1.5 rounded-sm transition-all duration-150 disabled:opacity-50"
                    >
                      {isProcessing ? "..." : "Confirmar"}
                    </button>
                    <button
                      onClick={() => handleDeny(reg.id)}
                      disabled={isProcessing}
                      className="tag text-red border border-red/30 hover:border-red hover:bg-red/5 px-3 py-1.5 rounded-sm transition-all duration-150 disabled:opacity-50"
                    >
                      {isProcessing ? "..." : "Recusar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
