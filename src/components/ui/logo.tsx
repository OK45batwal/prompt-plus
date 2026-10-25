import React, { useId } from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", showText = true, size = 26 }: LogoProps) {
  const id = useId();
  const markSize = Math.max(18, size + 4);
  const fontSize = Math.max(14, Math.round(size * 0.78));
  const badgeSize = Math.max(12, Math.round(size * 0.58));

  return (
    <div
      className={`inline-flex items-center gap-2 select-none group font-sans ${className}`}
      aria-label="Prompt+"
    >
      {/* Precision Geometric P+ Brand Emblem */}
      <span className="relative inline-flex items-center justify-center shrink-0">
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-105"
        >
          <defs>
            {/* Base Squircle Gradient */}
            <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>

            {/* Inner Sheen */}
            <linearGradient id={`${id}-sheen`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Accent Spark Glow */}
            <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Squircle Surface */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill={`url(#${id}-bg)`}
            className="fill-cyan-600 dark:fill-[#081a24]"
          />
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill={`url(#${id}-bg)`}
            opacity="0.95"
          />

          {/* Subtle Top-Border Highlight */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            stroke={`url(#${id}-sheen)`}
            strokeWidth="1.5"
            fill="none"
          />

          {/* Outer Ambient Glow Effect */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            stroke="#22d3ee"
            strokeWidth="1"
            strokeOpacity="0.45"
            fill="none"
          />

          {/* Architectural "P" Stem & Bowl */}
          {/* Vertical Stem */}
          <path
            d="M26 24C26 21.79 27.79 20 30 20H48C61.25 20 71 29.75 71 42C71 54.25 61.25 62 48 62H36V76C36 78.21 34.21 80 32 80C29.79 80 28 78.21 28 76V26C28 24.9 27.1 24 26 24Z"
            fill="#04141c"
            fillOpacity="0.25"
          />
          <path
            d="M27 24C27 21.79 28.79 20 31 20H48C61.25 20 70 29.75 70 42C70 54.25 61.25 62 48 62H37V75C37 77.21 35.21 79 33 79C30.79 79 29 77.21 29 75V26C29 24.9 28.1 24 27 24Z"
            fill="#ffffff"
          />

          {/* Inner Negative Space of "P" */}
          <path
            d="M39 30H47C54.73 30 60 35.27 60 42C60 48.73 54.73 53 47 53H39V30Z"
            fill={`url(#${id}-bg)`}
            className="fill-cyan-700 dark:fill-[#04141c]"
          />

          {/* Luminous "+" Spark Node at Upper-Right */}
          <circle cx="75" cy="27" r="14" fill={`url(#${id}-glow)`} opacity="0.6" />
          <path
            d="M75 19V35M67 27H83"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M75 21V33M69 27H81"
            stroke="#67e8f9"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Ambient Hover Glow Ring */}
        <span
          className="absolute -inset-0.5 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-cyan-400/40 pointer-events-none shadow-[0_0_12px_rgba(6,182,212,0.35)]"
        />
      </span>

      {/* Minimalist Wordmark with Luminous Micro-Badge */}
      {showText && (
        <span
          className="inline-flex items-center tracking-[-0.03em] font-bold text-foreground leading-none"
          style={{ fontSize: `${fontSize}px` }}
        >
          <span>Prompt</span>

          {/* Compact Luminous "+" Superscript Accent Chip */}
          <span
            className="inline-flex items-center justify-center font-mono font-black rounded-md ml-1 -translate-y-1 bg-cyan-500/10 dark:bg-cyan-400/15 border border-cyan-500/30 dark:border-cyan-400/40 text-cyan-600 dark:text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.22)] group-hover:shadow-[0_0_14px_rgba(6,182,212,0.45)] group-hover:border-cyan-400/60 transition-all duration-200"
            style={{
              height: `${badgeSize}px`,
              minWidth: `${badgeSize}px`,
              padding: "0 3.5px",
              fontSize: `${Math.max(10, Math.round(badgeSize * 0.72))}px`,
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            +
          </span>
        </span>
      )}
    </div>
  );
}
