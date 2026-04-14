"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn, formatCurrency, formatDate, formatTime, eventTypeLabel } from "@/lib/utils";
import { registerForEvent } from "@/lib/actions/registrations";
import type { BlindStructureLevel, Event } from "@/types";

function parseBlindStructure(raw: unknown): BlindStructureLevel[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter((row): row is BlindStructureLevel => row !== null && typeof row === "object");
}

function blindLevelsDurationMinutes(levels: BlindStructureLevel[]): number {
  return levels.reduce((sum, row) => sum + (typeof row.dur === "number" ? row.dur : 0), 0);
}

function formatDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}min`;
  return `${h}h ${m}min`;
}

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
  const [expanded, setExpanded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const blindLevels = useMemo(
    () => parseBlindStructure(event?.blindStructure),
    [event?.blindStructure]
  );
  const levelRows = useMemo(
    () => blindLevels.filter((row) => row.type === "level"),
    [blindLevels]
  );
  const blindDurationMin = useMemo(
    () => blindLevelsDurationMinutes(blindLevels),
    [blindLevels]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!event) return;
    setRegistered(false);
    setError(null);
    setExpanded(false);
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
      setError(e instanceof Error ? e.message : "Erro ao registrar interesse");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !event) return null;

  const count = registeredCount ?? event._count?.registrations ?? 0;
  const fillPct = Math.min(100, (count / event.maxPlayers) * 100);
  const spotsLeft = event.maxPlayers - count;
  const isLive = event.status === "LIVE";
  const isCashGame = event.type === "CASH_GAME";

  const ctaLabel = registered
    ? "Interesse declarado ✓"
    : "Declarar interesse";

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
          {/* Info grid — top row */}
          <div className="grid grid-cols-3 gap-4">
            {!isCashGame && (
              <div>
                <div className="tag text-text-muted mb-1">Buy-in</div>
                <div className="font-cormorant italic text-2xl font-light text-green leading-none">
                  {formatCurrency(event.buyIn)}
                </div>
              </div>
            )}
            <div className={isCashGame ? "col-span-2" : ""}>
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

          {/* GTD banner */}
          {!isCashGame && event.gtd && (
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
              <span className="tag text-text-muted">{count} interessados</span>
              <span className="tag text-text-muted">{event.maxPlayers} vagas</span>
            </div>
            <div className="h-px bg-border relative overflow-hidden">
              <div
                className="progress-fill absolute inset-y-0 left-0 bg-text"
                style={{ "--fill-width": `${fillPct}%` } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Extra info — tournament/home game */}
          {!isCashGame && (event.startingStack || event.levelDuration || event.rebuyPolicy || event.description) && (
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
                  <span className="tag text-text-muted">Duração do nível</span>
                  <span className="text-[12px] font-medium">{event.levelDuration}</span>
                </div>
              )}
              {event.rebuyPolicy && (
                <div>
                  <span className="tag text-text-muted block mb-1">Recompra</span>
                  <span className="text-[12px] text-text-muted">{event.rebuyPolicy}</span>
                </div>
              )}
            </div>
          )}

          {/* Extra info — cash game */}
          {isCashGame && (event.blinds || event.description) && (
            <div className="border border-border p-3 space-y-2 rounded-sm">
              {event.blinds && (
                <div className="flex justify-between">
                  <span className="tag text-text-muted">Blinds</span>
                  <span className="text-[12px] font-medium">{event.blinds}</span>
                </div>
              )}
              {event.maxPlayers && (
                <div className="flex justify-between">
                  <span className="tag text-text-muted">Vagas na mesa</span>
                  <span className="text-[12px] font-medium">{event.maxPlayers}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-[12px] text-text-muted leading-relaxed">{event.description}</p>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] uppercase tracking-wider text-[#9C9890] flex items-center gap-1 hover:text-[#2C2A27] transition-colors mt-2"
          >
            {expanded ? "▲ Menos detalhes" : "▼ Ver estrutura completa"}
          </button>

          {expanded && (
            <div className="border border-border bg-background rounded-sm p-3 space-y-3 text-[11px] text-text-muted">
              {!isCashGame && levelRows.length > 0 && (
                <div>
                  <div className="tag text-text-muted mb-2">Estrutura de blinds</div>
                  <div className="border border-border overflow-hidden rounded-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface border-b border-border">
                          <th className="px-2 py-1.5 font-medium text-[10px] uppercase tracking-wider">Nível</th>
                          <th className="px-2 py-1.5 font-medium text-[10px] uppercase tracking-wider">SB</th>
                          <th className="px-2 py-1.5 font-medium text-[10px] uppercase tracking-wider">BB</th>
                          <th className="px-2 py-1.5 font-medium text-[10px] uppercase tracking-wider">Ante</th>
                          <th className="px-2 py-1.5 font-medium text-[10px] uppercase tracking-wider">Min</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levelRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b border-border last:border-0">
                            <td className="px-2 py-1">{idx + 1}</td>
                            <td className="px-2 py-1">{row.sb ?? "—"}</td>
                            <td className="px-2 py-1">{row.bb ?? "—"}</td>
                            <td className="px-2 py-1">{row.ante ?? "—"}</td>
                            <td className="px-2 py-1">{row.dur ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {levelRows.length > 5 && (
                    <p className="tag text-text-muted mt-1.5">... e mais {levelRows.length - 5} níveis</p>
                  )}
                  <p className="text-[11px] mt-2">
                    Duração estimada: <span className="text-text font-medium">{formatDuration(blindDurationMin)}</span>
                  </p>
                </div>
              )}

              {!isCashGame && event.startStack != null && event.startStack > 0 && (
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="tag text-text-muted">Stack inicial</span>
                  <span className="text-[12px] font-medium text-text">{event.startStack.toLocaleString("pt-BR")}</span>
                </div>
              )}

              {!isCashGame && event.rebuyEnabled && (event.rebuyPrice != null || event.rebuyStack != null) && (
                <div className="border-t border-border pt-2">
                  <span className="tag text-text-muted">Rebuy</span>
                  <p className="text-[12px] text-text mt-0.5">
                    Rebuy:{" "}
                    {event.rebuyPrice != null ? formatCurrency(event.rebuyPrice) : ""}
                    {event.rebuyPrice != null && event.rebuyStack != null && " · "}
                    {event.rebuyStack != null && `Stack ${event.rebuyStack.toLocaleString("pt-BR")}`}
                  </p>
                </div>
              )}

              {!isCashGame && event.addonEnabled && (event.addonPrice != null || event.addonStack != null) && (
                <div className="border-t border-border pt-2">
                  <span className="tag text-text-muted">Add-on</span>
                  <p className="text-[12px] text-text mt-0.5">
                    Add-on:{" "}
                    {event.addonPrice != null ? formatCurrency(event.addonPrice) : ""}
                    {event.addonPrice != null && event.addonStack != null && " · "}
                    {event.addonStack != null && `Stack ${event.addonStack.toLocaleString("pt-BR")}`}
                  </p>
                </div>
              )}

              {!isCashGame && event.gtd != null && event.gtd > 0 && (
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="tag text-text-muted">GTD</span>
                  <span className="font-cormorant italic text-lg text-amber">{formatCurrency(event.gtd)}</span>
                </div>
              )}

              {isCashGame && (
                <div className="space-y-2">
                  <div className="tag text-text-muted mb-1">Mesa</div>
                  {event.blindType === "button" && event.btnValue != null && (
                    <div className="flex justify-between">
                      <span className="tag text-text-muted">Button blind</span>
                      <span className="text-[12px] font-medium text-text">{event.btnValue}</span>
                    </div>
                  )}
                  {(event.blindType === "sb-bb" || !event.blindType) &&
                    (event.sbValue != null || event.bbValue != null) && (
                    <div className="flex justify-between">
                      <span className="tag text-text-muted">Blinds</span>
                      <span className="text-[12px] font-medium text-text">
                        {event.sbValue ?? "—"} / {event.bbValue ?? "—"}
                      </span>
                    </div>
                  )}
                  {event.blindType === "button" && event.btnValue == null && event.blinds && (
                    <div className="flex justify-between">
                      <span className="tag text-text-muted">Blinds</span>
                      <span className="text-[12px] font-medium text-text">{event.blinds}</span>
                    </div>
                  )}
                  {(event.buyinMin != null || event.buyinMax != null) && (
                    <div className="flex justify-between">
                      <span className="tag text-text-muted">Buy-in</span>
                      <span className="text-[12px] font-medium text-text">
                        {event.buyinMin != null ? formatCurrency(event.buyinMin) : "—"} –{" "}
                        {event.buyinMax != null ? formatCurrency(event.buyinMax) : "—"}
                      </span>
                    </div>
                  )}
                  {event.rake != null && event.rake > 0 && (
                    <div className="flex justify-between">
                      <span className="tag text-text-muted">Rake</span>
                      <span className="text-[12px] font-medium text-text">
                        {event.rake}%
                        {event.rakeCap != null && event.rakeCap > 0 && !event.hideRake && (
                          <span className="text-text-muted"> · cap {formatCurrency(event.rakeCap)}</span>
                        )}
                        {event.hideRake && <span className="text-text-muted"> (oculto)</span>}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
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
