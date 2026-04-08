"use client";

import { cn, formatCurrency, formatTime, eventTypeLabel } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  registeredCount?: number;
  style?: React.CSSProperties;
}

export function EventCard({ event, onClick, registeredCount, style }: EventCardProps) {
  const count = registeredCount ?? event._count?.registrations ?? 0;
  const fillPct = Math.min(100, (count / event.maxPlayers) * 100);
  const isLive = event.status === "LIVE";
  const dateLabel = format(new Date(event.startsAt), "EEE, d MMM", { locale: ptBR });

  return (
    <article
      onClick={onClick}
      style={style}
      className={cn(
        "border border-border bg-background p-4 cursor-pointer group",
        "hover:border-[#B8B4AC] transition-all duration-150",
        "animate-card-deal"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isLive && (
            <span className="tag text-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
              Ao Vivo
            </span>
          )}
          <span className="tag text-text-muted">{eventTypeLabel(event.type)}</span>
          {event.isMajor && (
            <span className="tag text-amber">Major</span>
          )}
          {event.isPrivate && (
            <span className="tag text-text-muted border border-border px-1">Privado</span>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-cormorant italic text-xl font-light text-text leading-none">
            {formatCurrency(event.buyIn)}
          </div>
          {event.gtd && (
            <div className="tag text-amber mt-0.5">
              GTD {formatCurrency(event.gtd)}
            </div>
          )}
        </div>
      </div>

      {/* Venue / location */}
      <div className="tag text-text-muted mb-1">
        {event.venue
          ? `${event.venue.name} — ${event.venue.district}`
          : event.locationLabel ?? "Local a confirmar"}
      </div>

      {/* Name */}
      <h3 className="text-[13px] font-semibold text-text mb-3 leading-snug group-hover:text-[#3A3835] transition-colors">
        {event.name}
      </h3>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="tag text-text-muted">{count} inscritos</span>
          <span className="tag text-text-muted">{event.maxPlayers} vagas</span>
        </div>
        <div className="h-px bg-border relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-text transition-all duration-700"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="tag text-text-muted capitalize">{dateLabel}</span>
        <span className="tag text-text-muted">
          {formatTime(event.startsAt)}
          {event.endsAt && ` – ${formatTime(event.endsAt)}`}
        </span>
      </div>
    </article>
  );
}
