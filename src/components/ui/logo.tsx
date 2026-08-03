import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", showText = true, size = 26 }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Animated Logo Icon with Floating + Gradient Glow */}
      <span className="relative inline-flex animate-float shrink-0">
        <svg
          width={size + 6}
          height={size + 6}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-pulse-glow rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1D70F5" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          {/* Stylized P Container with Gradient */}
          <path
            d="M22 90V28C22 16 32 10 52 10C72 10 85 22 85 40C85 58 72 68 52 68H42V90H22Z"
            fill="url(#logoGradient)"
          />
          {/* Cutout Arrow inside P */}
          <path
            d="M26 68L56 38M56 38H42M56 38V52"
            stroke="white"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Animated outer ring on hover */}
        <span className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-blue-400/50 animate-pulse pointer-events-none" style={{ animationDuration: "1.5s" }} />
      </span>

      {showText && (
        <span className="font-extrabold tracking-tight text-foreground text-lg flex items-center">
          <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">P</span>
          <span>rompt</span>
          <span className="text-blue-500 font-black text-xl ml-0.5 animate-pulse inline-block">+</span>
        </span>
      )}
    </div>
  );
}
