"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn, formatCurrency, formatDate, formatTime, eventTypeLabel } from "@/lib/utils";
import { registerForEvent } from "@/lib/actions/registrations";
import type { Event } from "@/types";

interface EventModalProps {
  event: Event | null;
  registeredCount?: number;
  onClose: () => void;
}

export function EventModal({ event, registeredCount, onClose }: EventModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!event) return;
    setRegistered(false);
    setError(null);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [event, onClose]);

  const handleRegister = async () => {
    if (!event) return;
    setLoading(true);
    setError(null);
    try {
      const result = await registerForEvent({ eventId: event.id });
      if (result?.serverError) {
        setError(result.serverError);
      } else {
        setRegistered(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao inscrever");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !event) return null;

  const count = registeredCount ?? event._count?.registrations ?? 0;
  const fillPct = Math.min(100, (count / event.maxPlayers) * 100);
  const spotsLeft = event.maxPlayers - count;
  const isLive = event.status === "LIVE";

  const ctaLabel = registered
    ? "Inscrito ✓"
    : event.isPrivate
    ? "Solicitar Acesso"
    : event.type === "CASH_GAME"
    ? "Reservar Assento"
    : "Inscrever-se";

  const modal = (
    <div
      ref={overlayRef}
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="modal-content bg-background w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark header */}
        <div className="bg-sidebar px-6 py-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              {isLive && (
                <span className="tag text-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green inline-block animate-pulse" />
                  Ao Vivo
                </span>
              )}
              <span className="tag text-[#9B9690]">{eventTypeLabel(event.type)}</span>
              {event.isMajor && <span className="tag text-amber">Major</span>}
              {event.isPrivate && <span className="tag text-[#6B6660]">Privado</span>}
            </div>
            <button
              onClick={onClose}
              className="text-[#6B6660] hover:text-white transition-colors text-lg leading-none ml-4"
            >
              ✕
            </button>
          </div>
          <div className="tag text-[#6B6660] mb-1">
            {event.venue
              ? `${event.venue.name} — ${event.venue.district}`
              : event.locationLabel ?? "Local a confirmar"}
          </div>
          <h2 className="text-white text-[18px] font-semibold leading-tight">{event.name}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="tag text-text-muted mb-1">Buy-in</div>
              <div className="font-cormorant italic text-2xl font-light text-green leading-none">
                {formatCurrency(event.buyIn)}
              </div>
            </div>
            <div>
              <div className="tag text-text-muted mb-1">Horário</div>
              <div className="font-cormorant italic text-2xl font-light text-text leading-none">
                {formatTime(event.startsAt)}
                {event.endsAt && (
                  <span className="text-text-muted text-lg"> – {formatTime(event.endsAt)}</span>
                )}
              </div>
              <div className="tag text-text-muted mt-0.5">{formatDate(event.startsAt)}</div>
            </div>
            <div>
              <div className="tag text-text-muted mb-1">Vagas</div>
              <div className="font-cormorant italic text-2xl font-light text-amber leading-none">
                {spotsLeft > 0 ? spotsLeft : "0"}
              </div>
              <div className="tag text-text-muted mt-0.5">restantes</div>
            </div>
          </div>

          {event.gtd && (
            <div className="border border-amber/30 bg-amber/5 px-3 py-2 flex items-center justify-between rounded-sm">
              <span className="tag text-amber">Garantido</span>
              <span className="font-cormorant italic text-xl font-light text-amber">
                {formatCurrency(event.gtd)}
              </span>
            </div>
          )}

          {/* Progress */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="tag text-text-muted">{count} inscritos</span>
              <span className="tag text-text-muted">{event.maxPlayers} vagas</span>
            </div>
            <div className="h-px bg-border relative overflow-hidden">
              <div
                className="progress-fill absolute inset-y-0 left-0 bg-text"
                style={{ "--fill-width": `${fillPct}%` } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Structure info */}
          {(event.startingStack || event.levelDuration || event.rebuyPolicy) && (
            <div className="border border-border p-3 space-y-2 rounded-sm">
              <div className="tag text-text-muted mb-2">Estrutura</div>
              {event.startingStack && (
                <div className="flex justify-between">
                  <span className="tag text-text-muted">Stack inicial</span>
                  <span className="text-[12px] font-medium">{event.startingStack}</span>
                </div>
              )}
              {event.levelDuration && (
                <div className="flex justify-between">
                  <span className="tag text-text-muted">Nível</span>
                  <span className="text-[12px] font-medium">{event.levelDuration}</span>
                </div>
              )}
              {event.rebuyPolicy && (
                <div>
                  <span className="tag text-text-muted block mb-1">Re-entry</span>
                  <span className="text-[12px] text-text-muted">{event.rebuyPolicy}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-[12px] text-text-muted leading-relaxed">{event.description}</p>
          )}

          {/* Error */}
          {error && (
            <div className="text-[12px] text-red bg-red/5 border border-red/20 px-3 py-2 rounded-sm">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleRegister}
            disabled={loading || registered || event.status === "FINISHED" || event.status === "CANCELLED"}
            className={cn(
              "w-full py-3 text-[12px] font-semibold tracking-wide transition-all duration-150",
              registered
                ? "bg-green text-white cursor-default"
                : event.status === "FINISHED" || event.status === "CANCELLED"
                ? "bg-surface text-text-muted cursor-not-allowed"
                : "bg-text text-background hover:bg-[#3A3835] active:scale-[0.98]",
              "rounded-sm"
            )}
          >
            {loading ? "Processando..." : ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
