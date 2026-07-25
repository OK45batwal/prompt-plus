import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", showText = true, size = 20 }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 select-none font-sans ${className}`}>
      {/* Minimalist prompt emblem badge */}
      <div
        className="flex items-center justify-center rounded-md bg-foreground text-background font-mono font-bold tracking-tighter shadow-sm transition-transform hover:scale-105"
        style={{ width: size + 8, height: size + 8, fontSize: size * 0.6 }}
      >
        &gt;_
      </div>

      {showText && (
        <span className="font-extrabold tracking-wider text-foreground text-base flex items-center gap-1 uppercase">
          Prompt
          <span className="bg-blue-600 text-white dark:bg-blue-500 text-xs font-black px-1.5 py-0.5 rounded-md leading-none shadow-sm">
            +
          </span>
        </span>
      )}
    </div>
  );
}
