"use client";

export function Logo({ collapsed = false, size = "default" }: { collapsed?: boolean; size?: "default" | "large" }) {
  const svgSize = size === "large" ? "h-12 w-12" : "h-8 w-8";
  const textSize = size === "large" ? "text-[30px]" : "text-[18px]";

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 40 40" fill="none" className={svgSize}>
          <defs>
            <linearGradient id="kron-g1" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="40%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            <linearGradient id="kron-g2" x1="8" y1="8" x2="32" y2="32">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="kron-g3" x1="20" y1="0" x2="20" y2="40">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          {/* Shield/badge background */}
          <rect x="4" y="6" width="32" height="30" rx="6" fill="url(#kron-g1)" opacity="0.08" />
          {/* Crown - 3 points with gems */}
          <path
            d="M8 24L12 12L16.5 18L20 10L23.5 18L28 12L32 24"
            stroke="url(#kron-g3)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Crown base band */}
          <path
            d="M9 24L31 24"
            stroke="url(#kron-g2)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Crown base fill */}
          <rect x="9" y="25" width="22" height="5" rx="2" fill="url(#kron-g1)" opacity="0.15" />
          <rect x="9" y="25" width="22" height="5" rx="2" stroke="url(#kron-g2)" strokeWidth="1" fill="none" opacity="0.3" />
          {/* Gem dots on crown points */}
          <circle cx="20" cy="10" r="2" fill="url(#kron-g2)" />
          <circle cx="12" cy="12.5" r="1.5" fill="#FBBF24" opacity="0.7" />
          <circle cx="28" cy="12.5" r="1.5" fill="#FBBF24" opacity="0.7" />
          {/* Small sparkle accents */}
          <circle cx="15" cy="27.5" r="1" fill="#FCD34D" opacity="0.5" />
          <circle cx="20" cy="27.5" r="1" fill="#FCD34D" opacity="0.7" />
          <circle cx="25" cy="27.5" r="1" fill="#FCD34D" opacity="0.5" />
        </svg>
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className={`${textSize} font-black tracking-tight gradient-text`}>
            kron
          </span>
          {size === "large" && (
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mt-0.5">
              rule your time
            </span>
          )}
        </div>
      )}
    </div>
  );
}
