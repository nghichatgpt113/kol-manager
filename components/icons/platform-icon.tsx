import React from "react";
import type { KolPlatform } from "@/lib/types/kol";

interface PlatformIconProps {
  platform: KolPlatform | string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

// Precise, mathematically centered TikTok note path (centered at 12, 12 in 24x24 viewBox)
const TIKTOK_NOTE_PATH =
  "M12.5 4h2.2a5 5 0 0 0 4.3 4.2v2.5a7.5 7.5 0 0 1-4.3-1.4v6.2a4.5 4.5 0 1 1-4.5-4.5c.4 0 .9.1 1.3.2v2.4a2.2 2.2 0 1 0 1 1.9V4z";

export default function PlatformIcon({
  platform,
  size = "sm",
  className = "",
}: PlatformIconProps) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;
  const combinedClass = `${sizeClass} shrink-0 aspect-square ${className}`;

  switch (platform) {
    case "tiktok":
      return (
        <svg
          className={combinedClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* Black rounded background */}
          <rect width="24" height="24" rx="6" fill="#000000" />

          {/* Cyan 3D offset */}
          <path
            d={TIKTOK_NOTE_PATH}
            fill="#25F4EE"
            transform="translate(-0.5 0.4)"
          />

          {/* Red 3D offset */}
          <path
            d={TIKTOK_NOTE_PATH}
            fill="#FE2C55"
            transform="translate(0.5 -0.4)"
          />

          {/* Pure White main note */}
          <path
            d={TIKTOK_NOTE_PATH}
            fill="#FFFFFF"
          />
        </svg>
      );

    case "facebook":
      return (
        <svg
          className={combinedClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* Facebook Blue background */}
          <rect width="24" height="24" rx="6" fill="#1877F2" />

          {/* Official white 'f' logo */}
          <path
            d="M13.5 21v-6.8h2.3l.35-2.7h-2.65V9.8c0-.8.2-1.3 1.35-1.3h1.45V6.1c-.25-.03-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v1.9H8.4v2.7h2.35V21h2.75z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "instagram":
      return (
        <svg
          className={combinedClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="ig-gradient-perfect"
              x1="0%"
              y1="100%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#FED373" />
              <stop offset="25%" stopColor="#F15245" />
              <stop offset="50%" stopColor="#D92E7F" />
              <stop offset="75%" stopColor="#9B36B7" />
              <stop offset="100%" stopColor="#515ECF" />
            </linearGradient>
          </defs>

          {/* Instagram gradient background */}
          <rect width="24" height="24" rx="6" fill="url(#ig-gradient-perfect)" />

          {/* Camera rounded frame - exactly centered at 12, 12 */}
          <rect
            x="5.2"
            y="5.2"
            width="13.6"
            height="13.6"
            rx="4"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />

          {/* Camera center lens - concentric circle at 12, 12 */}
          <circle
            cx="12"
            cy="12"
            r="3.3"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />

          {/* Camera flash dot */}
          <circle
            cx="15.8"
            cy="8.2"
            r="0.9"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "youtube":
      return (
        <svg
          className={combinedClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* YouTube Red background */}
          <rect width="24" height="24" rx="6" fill="#FF0000" />

          {/* White screen box - perfectly centered at 12, 12 */}
          <rect
            x="3.8"
            y="6.2"
            width="16.4"
            height="11.6"
            rx="3.4"
            fill="#FFFFFF"
          />

          {/* Red Play triangle - optically centered inside white screen */}
          <polygon
            points="10.2 9, 15.2 12, 10.2 15"
            fill="#FF0000"
          />
        </svg>
      );

    case "shopee":
      return (
        <svg
          className={combinedClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* Shopee Orange background */}
          <rect width="24" height="24" rx="6" fill="#EE4D2D" />

          {/* Shopping bag handle - perfectly joined to body */}
          <path
            d="M8.5 7.5V6a3.5 3.5 0 0 1 7 0v1.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Shopping bag body */}
          <path
            d="M4.5 7.5h15l-1.4 12.2a2 2 0 0 1-2 1.8H7.9a2 2 0 0 1-2-1.8L4.5 7.5z"
            fill="#FFFFFF"
          />

          {/* Letter S cutout in Shopee Orange */}
          <path
            d="M13.6 11.2c-.2-.5-.7-.8-1.4-.8-.9 0-1.5.4-1.5 1.1 0 .6.4.9 1.3 1.2 1.2.3 2.1.8 2.1 1.9 0 1.4-1.1 2.2-2.4 2.2-1.3 0-2.2-.6-2.5-1.7l1.2-.4c.2.6.6.9 1.3.9.7 0 1.2-.4 1.2-.9 0-.5-.4-.8-1.3-1.1-1.3-.4-2.1-.8-2.1-1.9 0-1.3 1-2.1 2.4-2.1 1.1 0 1.9.5 2.2 1.4l-1.2.3z"
            fill="#EE4D2D"
          />
        </svg>
      );

    default:
      return (
        <svg
          className={combinedClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* Neutral dark background */}
          <rect
            width="24"
            height="24"
            rx="6"
            className="fill-zinc-600 dark:fill-zinc-700"
          />

          {/* Outer circle */}
          <circle
            cx="12"
            cy="12"
            r="6"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.4"
          />

          {/* Longitude meridian */}
          <ellipse
            cx="12"
            cy="12"
            rx="2.5"
            ry="6"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.4"
          />

          {/* Latitude equator */}
          <line
            x1="6"
            y1="12"
            x2="18"
            y2="12"
            stroke="#FFFFFF"
            strokeWidth="1.4"
          />
        </svg>
      );
  }
}