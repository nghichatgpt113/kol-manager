import { getNicheStyle } from "@/lib/constants/niches";

interface NicheBadgeProps {
  niche?: string | null;
  showDot?: boolean;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export default function NicheBadge({
  niche,
  showDot = true,
  showIcon = false,
  className = "",
  size = "sm",
}: NicheBadgeProps) {
  if (!niche || !niche.trim()) {
    return <span className="text-zinc-400 text-xs">—</span>;
  }

  // Handle potential comma-separated niches (e.g. "Làm đẹp, Thời trang")
  const parts = niche
    .split(/[,/]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return <span className="text-zinc-400 text-xs">—</span>;
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2.5 py-0.5"
      : "text-xs px-3 py-1";

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {parts.map((part) => {
        const style = getNicheStyle(part);
        return (
          <span
            key={part}
            className={`inline-flex items-center gap-1.5 rounded-full font-medium border shadow-2xs whitespace-nowrap transition-all duration-150 ${sizeClasses} ${style.badgeClass}`}
          >
            {showIcon && style.icon && (
              <span className="text-xs leading-none shrink-0">{style.icon}</span>
            )}
            {showDot && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotClass}`}
                aria-hidden="true"
              />
            )}
            <span className="truncate max-w-[180px]">{part}</span>
          </span>
        );
      })}
    </div>
  );
}
