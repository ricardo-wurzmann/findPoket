"use client";

import { useState } from "react";
import { declareVenueInterest } from "@/lib/actions/venues";
import { cn } from "@/lib/utils";

interface Props {
  venueId: string;
  initialCount: number;
  initialDeclared: boolean;
}

export function DeclareVenueInterestButton({ venueId, initialCount, initialDeclared }: Props) {
  const [loading, setLoading] = useState(false);
  const [declared, setDeclared] = useState(initialDeclared);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (declared) return;
    setLoading(true);
    setError(null);
    try {
      const result = await declareVenueInterest({ venueId });
      if (result?.serverError) {
        setError(result.serverError);
      } else {
        setDeclared(true);
        if (result?.data?.count !== undefined) setCount(result.data.count);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao declarar interesse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={loading || declared}
        className={cn(
          "w-full py-3 text-[12px] font-semibold tracking-wide transition-all duration-150 rounded-sm",
          declared
            ? "bg-green text-white cursor-default"
            : "bg-text text-background hover:bg-[#3A3835] active:scale-[0.98]",
          (loading) && "opacity-60"
        )}
      >
        {loading ? "Processando..." : declared ? "Interesse declarado ✓" : "Declarar interesse"}
      </button>

      {count > 0 && (
        <p className="tag text-text-muted text-center">
          {count} {count === 1 ? "pessoa interessada" : "pessoas interessadas"}
        </p>
      )}

      {error && (
        <p className="text-[11px] text-red text-center">{error}</p>
      )}
    </div>
  );
}
