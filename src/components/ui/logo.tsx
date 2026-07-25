import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", showText = true, size = 26 }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Stylized 'P' Icon with Upward Arrow */}
      <svg
        width={size + 4}
        height={size + 4}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:scale-105 flex-shrink-0"
      >
        {/* Stylized P Container */}
        <path
          d="M22 90V28C22 16 32 10 52 10C72 10 85 22 85 40C85 58 72 68 52 68H42V90H22Z"
          fill="#1D70F5"
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

      {showText && (
        <span className="font-extrabold tracking-tight text-foreground text-lg flex items-center">
          <span className="text-[#1D70F5]">P</span>
          <span>rompt</span>
          <span className="text-[#1D70F5] font-black text-xl ml-0.5">+</span>
        </span>
      )}
    </div>
  );
}
