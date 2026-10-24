"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore, useCallback, MouseEvent } from "react";
import { Sun, Moon } from "lucide-react";

const emptySubscribe = () => () => {};

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const toggleTheme = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

      // If browser supports View Transitions API and reduced motion is false
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        document.documentElement.classList.add("theme-transition");

        const transition = (document as Document & {
          startViewTransition: (callback: () => void) => {
            ready: Promise<void>;
          };
        }).startViewTransition(() => {
          setTheme(nextTheme);
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];

          document.documentElement.animate(
            {
              clipPath: nextTheme === "dark" ? clipPath : [...clipPath].reverse(),
            },
            {
              duration: 480,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement:
                nextTheme === "dark"
                  ? "::view-transition-new(root)"
                  : "::view-transition-old(root)",
            }
          );
        });

        setTimeout(() => {
          document.documentElement.classList.remove("theme-transition");
        }, 550);
      } else {
        // Fallback smooth transition
        if (typeof document !== "undefined") {
          document.documentElement.classList.add("theme-transition");
          setTimeout(() => {
            document.documentElement.classList.remove("theme-transition");
          }, 450);
        }
        setTheme(nextTheme);
      }
    },
    [resolvedTheme, setTheme]
  );

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative flex h-8.5 w-8.5 items-center justify-center rounded-full border border-border/80 bg-background/80 hover:bg-accent/70 hover:border-cyan-500/40 text-foreground transition-all duration-300 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <div className="relative h-4 w-4 overflow-hidden flex items-center justify-center">
        {/* Sun Icon (light mode) */}
        <Sun
          className={`absolute h-4 w-4 text-amber-500 transition-all duration-500 transform ${
            isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        {/* Moon Icon (dark mode) */}
        <Moon
          className={`absolute h-4 w-4 text-cyan-400 transition-all duration-500 transform ${
            isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
