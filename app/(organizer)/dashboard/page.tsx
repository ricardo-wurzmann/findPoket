"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, formatTime, eventTypeLabel, eventStatusLabel } from "@/lib/utils";
import { cancelEvent } from "@/lib/actions/events";
import { cn } from "@/lib/utils";

interface DashboardData {
  todayRegistrations: number;
  estimatedRevenue: number;
  activeEvents: number;
  pendingRequests: number;
  events: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    buyIn: number;
    startsAt: string;
    maxPlayers: number;
    registrationCount: number;
    venue?: { name: string; district: string } | null;
  }>;
}

function CountUp({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return <>{prefix}{current.toLocaleString("pt-BR")}</>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/organizer/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    };
    fetchData();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancelar este evento?")) return;
    setCancelingId(id);
    try {
      await cancelEvent({ id });
      setData((prev) =>
        prev
          ? {
              ...prev,
              events: prev.events.map((e) =>
                e.id === id ? { ...e, status: "CANCELLED" } : e
              ),
            }
          : prev
      );
    } finally {
      setCancelingId(null);
    }
  };

  const kpis = data
    ? [
        {
          label: "Inscritos Hoje",
          value: data.todayRegistrations,
          prefix: "",
          color: "text-green",
        },
        {
          label: "Receita Estimada",
          value: data.estimatedRevenue,
          prefix: "R$ ",
          color: "text-amber",
        },
        {
          label: "Eventos Ativos",
          value: data.activeEvents,
          prefix: "",
          color: "text-text",
        },
        {
          label: "Solicitações",
          value: data.pendingRequests,
          prefix: "",
          color: "text-text",
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-5 pl-16 lg:pl-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold">Dashboard</h1>
            <p className="tag text-text-muted mt-0.5">Visão geral dos seus eventos</p>
          </div>
          <Link
            href="/events/create"
            className="bg-text text-background tag px-4 py-2 hover:bg-[#3A3835] transition-colors rounded-sm"
          >
            + Novo Evento
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border border-b border-border">
          {data === null
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-5">
                  <div className="h-3 bg-surface rounded w-20 mb-3 animate-pulse" />
                  <div className="h-8 bg-surface rounded w-16 animate-pulse" />
                </div>
              ))
            : kpis.map((kpi) => (
                <div key={kpi.label} className="px-6 py-5">
                  <div className="tag text-text-muted mb-2">{kpi.label}</div>
                  <div className={cn("font-cormorant italic text-4xl font-light", kpi.color)}>
                    <CountUp target={kpi.value} prefix={kpi.prefix} />
                  </div>
                </div>
              ))}
        </div>

        {/* Events list */}
        <div className="px-6 py-6">
          <h2 className="tag text-text-muted mb-4">Seus Eventos</h2>

          {data === null ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-border h-16 bg-surface animate-pulse rounded-sm" />
              ))}
            </div>
          ) : data.events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted border border-border rounded-sm">
              <span className="text-3xl mb-2 opacity-20">◈</span>
              <p className="tag">Nenhum evento criado</p>
              <Link href="/events/create" className="tag text-text underline mt-2">
                Criar primeiro evento →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-sm">
              {data.events.map((event) => {
                const fillPct = Math.min(100, (event.registrationCount / event.maxPlayers) * 100);
                const isLive = event.status === "LIVE";
                const isCancelled = event.status === "CANCELLED";
                return (
                  <div key={event.id} className={cn("flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors", isCancelled && "opacity-50")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {isLive && (
                          <span className="tag text-green flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green" />
                            Ao Vivo
                          </span>
                        )}
                        <span className="tag text-text-muted">{eventTypeLabel(event.type)}</span>
                        {isCancelled && <span className="tag text-red">Cancelado</span>}
                      </div>
                      <div className="text-[13px] font-medium truncate">{event.name}</div>
                      {event.venue && (
                        <div className="tag text-text-muted mt-0.5">
                          {event.venue.name} · {formatDate(event.startsAt)} {formatTime(event.startsAt)}
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="w-24 hidden sm:block">
                      <div className="flex justify-between mb-1">
                        <span className="tag text-text-muted">{event.registrationCount}</span>
                        <span className="tag text-text-muted">{event.maxPlayers}</span>
                      </div>
                      <div className="h-px bg-border">
                        <div className="h-full bg-text" style={{ width: `${fillPct}%` }} />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-cormorant italic text-xl font-light text-green">
                        {formatCurrency(event.buyIn)}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isCancelled && (
                      <div className="flex gap-2 shrink-0">
                        <Link
                          href={`/events/${event.id}/edit`}
                          className="tag text-text-muted hover:text-text border border-border px-2 py-1 rounded-sm transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleCancel(event.id)}
                          disabled={cancelingId === event.id}
                          className="tag text-red hover:text-red border border-red/30 hover:border-red px-2 py-1 rounded-sm transition-colors disabled:opacity-50"
                        >
                          {cancelingId === event.id ? "..." : "Cancelar"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
