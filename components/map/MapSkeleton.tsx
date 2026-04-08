export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-sidebar flex flex-col items-center justify-center relative overflow-hidden">
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.8s linear infinite",
        }}
      />
      {/* Grid lines suggestion */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute w-full h-px bg-white" style={{ top: `${(i + 1) * 12.5}%` }} />
        ))}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute h-full w-px bg-white" style={{ left: `${(i + 1) * 12.5}%` }} />
        ))}
      </div>
      {/* Center content */}
      <div className="relative text-center">
        <div className="font-cormorant italic text-4xl font-light text-white opacity-20 mb-3 select-none">
          ◎
        </div>
        <p className="text-[9px] font-medium tracking-[.12em] uppercase text-[#6B6660]">
          Carregando mapa...
        </p>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
