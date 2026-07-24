import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", showText = true, size = 22 }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek SVG Icon matching the modern dark/light UI */}
      <div
        className="relative flex items-center justify-center rounded-lg bg-foreground text-background shadow-sm transition-transform hover:scale-105"
        style={{ width: size + 10, height: size + 10 }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Stylized Prompt Cursor '>' */}
          <path d="M4 17L11 12L4 7" className="opacity-90" />
          {/* Sparkles / Magic AI '+' icon */}
          <path d="M15 8V16" strokeWidth="2" />
          <path d="M11 12H19" strokeWidth="2" />
          <circle cx="18" cy="6" r="1" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-0.5">
          AI Prompt
          <span className="text-blue-500 font-extrabold text-base leading-none">+</span>
        </span>
      )}
    </div>
  );
}
