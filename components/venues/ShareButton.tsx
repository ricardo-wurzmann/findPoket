"use client";

import { useState } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-3 border border-border px-4 py-3 rounded-sm hover:border-[#B8B4AC] transition-colors w-full text-left"
    >
      <span className="text-[16px]">🔗</span>
      <div className="text-[13px] font-medium">
        {copied ? "Link copiado!" : "Compartilhar"}
      </div>
    </button>
  );
}
