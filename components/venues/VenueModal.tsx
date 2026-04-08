"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency, formatTime, eventTypeLabel } from "@/lib/utils";
import type { Venue, Event } from "@/types";

interface VenueModalProps {
  venue: (Venue & { events?: Event[] }) | null;
  onClose: () => void;
}

export function VenueModal({ venue, onClose }: VenueModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!venue) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [venue, onClose]);

  if (!mounted || !venue) return null;

  const upcomingEvents = (venue.events ?? []).filter(
    (e) => e.status === "UPCOMING" || e.status === "LIVE"
  );

  const modal = (
    <div
      ref={overlayRef}
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="modal-content bg-background w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-sidebar px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="tag text-[#6B6660] mb-1">{venue.district} · {venue.city}</div>
              <h2 className="text-white text-[18px] font-semibold">{venue.name}</h2>
              <p className="text-[11px] text-[#6B6660] mt-1">{venue.address}</p>
            </div>
            <button onClick={onClose} className="text-[#6B6660] hover:text-white transition-colors text-lg">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 border border-border p-4 rounded-sm">
            <div>
              <div className="tag text-text-muted">Horário</div>
              <div className="text-[12px] font-medium mt-1">{venue.openTime} — {venue.closeTime}</div>
            </div>
            <div>
              <div className="tag text-text-muted">Mesas</div>
              <div className="text-[12px] font-medium mt-1">{venue.tableCount}</div>
            </div>
          </div>

          {/* Upcoming events */}
          {upcomingEvents.length > 0 && (
            <div>
              <div className="tag text-text-muted mb-3">Próximos Eventos</div>
              <div className="space-y-2">
                {upcomingEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between border border-border p-3 rounded-sm"
                  >
                    <div>
                      <div className="text-[12px] font-medium">{e.name}</div>
                      <div className="tag text-text-muted mt-0.5">
                        {eventTypeLabel(e.type)} · {formatTime(e.startsAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-cormorant italic text-lg font-light text-green">
                        {formatCurrency(e.buyIn)}
                      </div>
                      {e.status === "LIVE" && (
                        <div className="tag text-green">Ao Vivo</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-2">
            <div className="tag text-text-muted mb-2">Contato</div>
            {venue.whatsapp && (
              <a
                href={`https://wa.me/${venue.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-sm hover:border-[#B8B4AC] transition-colors"
              >
                <span className="text-[13px]">💬</span>
                <span className="text-[12px] font-medium">WhatsApp</span>
              </a>
            )}
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-sm hover:border-[#B8B4AC] transition-colors"
              >
                <span className="text-[13px]">🌐</span>
                <span className="text-[12px] font-medium">Site Oficial</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
