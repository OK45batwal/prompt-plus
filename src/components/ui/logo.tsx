import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", showText = true, size = 26 }: LogoProps) {
  const iconSize = size + 6;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Animated Logo Icon with Floating + Hover Glow */}
      <span className="relative inline-flex animate-float shrink-0">
        <Image
          src="/prompt-plus-logo.png"
          alt="Prompt+ Logo"
          width={iconSize}
          height={iconSize}
          unoptimized
          priority
          className="rounded-xl object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0"
        />
        {/* Animated outer ring on hover */}
        <span
          className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-cyan-400/50 animate-pulse pointer-events-none"
          style={{ animationDuration: "1.5s" }}
        />
      </span>

      {showText && (
        <span className="font-extrabold tracking-tight text-foreground text-lg flex items-center">
          <span className="bg-linear-to-r from-cyan-300 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">P</span>
          <span>rompt</span>
          <span className="text-cyan-500 font-black text-xl ml-0.5 animate-pulse inline-block">+</span>
        </span>
      )}
    </div>
  );
}
