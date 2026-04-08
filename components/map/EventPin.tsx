"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Event } from "@/types";

interface EventPinProps {
  event: Event;
  onClick?: () => void;
  isSelected?: boolean;
}

function getPinStyle(event: Event): {
  bg: string;
  border: string;
  size: number;
  pulseClass: string;
  borderStyle: string;
} {
  const isLive = event.status === "LIVE";
  const isMajor = event.isMajor;
  const isPrivate = event.isPrivate || event.type === "HOME_GAME";

  if (isMajor) {
    return {
      bg: "#0A0A0A",
      border: "#D97706",
      size: 22,
      pulseClass: "pin-major",
      borderStyle: "solid",
    };
  }
  if (isPrivate) {
    return {
      bg: "transparent",
      border: "#6B7280",
      size: 16,
      pulseClass: "",
      borderStyle: "dashed",
    };
  }
  if (event.type === "CASH_GAME") {
    return {
      bg: "#3B82F6",
      border: "#ffffff",
      size: 16,
      pulseClass: "",
      borderStyle: "solid",
    };
  }
  if (isLive) {
    return {
      bg: "#22C55E",
      border: "#ffffff",
      size: 16,
      pulseClass: "pin-live",
      borderStyle: "solid",
    };
  }
  // TOURNAMENT / SIT_AND_GO upcoming
  return {
    bg: "#D97706",
    border: "#ffffff",
    size: 16,
    pulseClass: "pin-upcoming",
    borderStyle: "solid",
  };
}

export function EventPin({ event, onClick, isSelected }: EventPinProps) {
  const [hovered, setHovered] = useState(false);
  const pin = getPinStyle(event);

  return (
    <div
      className="relative"
      style={{ zIndex: isSelected ? 20 : hovered ? 15 : 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute bottom-full left-1/2 mb-2 pointer-events-none"
          style={{
            transform: "translateX(-50%)",
            zIndex: 30,
            whiteSpace: "nowrap",
          }}
        >
          <div
            className="bg-[#1E1D1A] border border-[#2A2926] px-2.5 py-1.5 rounded-sm"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
          >
            {event.venue && (
              <div className="text-[9px] font-medium tracking-[.1em] uppercase text-[#6B6660] mb-0.5">
                {event.venue.name}
              </div>
            )}
            <div className="text-[11px] font-medium text-white max-w-[180px] truncate">
              {event.name}
            </div>
            <div className="text-[10px] text-[#22C55E] font-medium mt-0.5">
              {formatCurrency(event.buyIn)}
            </div>
          </div>
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #2A2926",
            }}
          />
        </div>
      )}

      {/* Pin */}
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center rounded-full cursor-pointer focus:outline-none transition-transform duration-150 ${pin.pulseClass}`}
        style={{
          width: `${isSelected ? pin.size * 1.3 : pin.size}px`,
          height: `${isSelected ? pin.size * 1.3 : pin.size}px`,
          backgroundColor: pin.bg,
          border: `2px ${pin.borderStyle} ${pin.border}`,
          boxShadow: isSelected ? `0 0 0 3px rgba(255,255,255,0.4)` : undefined,
          transition: "width 0.15s, height 0.15s, box-shadow 0.15s",
        }}
        aria-label={event.name}
      />
    </div>
  );
}
