"use client";

import { cn } from "@/lib/utils";

interface ModeToggleProps {
  value: "PLAYER" | "ORGANIZER";
  onChange: (value: "PLAYER" | "ORGANIZER") => void;
  className?: string;
}

export function ModeToggle({ value, onChange, className }: ModeToggleProps) {
  return (
    <div className={cn("flex bg-[#141412] rounded-sm overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => onChange("PLAYER")}
        className={cn(
          "flex-1 py-2 px-4 text-center tag transition-all duration-150",
          value === "PLAYER"
            ? "bg-[#252320] text-white"
            : "text-[#6B6660] hover:text-white"
        )}
      >
        Jogador
      </button>
      <button
        type="button"
        onClick={() => onChange("ORGANIZER")}
        className={cn(
          "flex-1 py-2 px-4 text-center tag transition-all duration-150",
          value === "ORGANIZER"
            ? "bg-[#252320] text-white"
            : "text-[#6B6660] hover:text-white"
        )}
      >
        Organizador
      </button>
    </div>
  );
}
