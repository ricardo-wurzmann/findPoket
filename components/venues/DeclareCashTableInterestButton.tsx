"use client";

import { useState } from "react";
import { declareCashTableInterest } from "@/lib/actions/cashTables";
import { cn } from "@/lib/utils";

interface Props {
  cashTableId: string;
  initialDeclared: boolean;
}

export function DeclareCashTableInterestButton({ cashTableId, initialDeclared }: Props) {
  const [loading, setLoading] = useState(false);
  const [declared, setDeclared] = useState(initialDeclared);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (declared) return;
    setLoading(true);
    setError(null);
    try {
      const result = await declareCashTableInterest({ cashTableId });
      if (result?.serverError) {
        setError(result.serverError);
      } else {
        setDeclared(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao declarar interesse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || declared}
        className={cn(
          "tag px-3 py-2 rounded-sm border transition-colors shrink-0",
          declared
            ? "border-green text-green bg-green/5 cursor-default"
            : "border-border bg-background hover:border-[#B8B4AC] text-text",
          loading && "opacity-60"
        )}
      >
        {loading ? "…" : declared ? "Interesse ✓" : "Declarar interesse"}
      </button>
      {error && <p className="text-[10px] text-red">{error}</p>}
    </div>
  );
}
