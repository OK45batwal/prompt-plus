"use client";

import { useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  targetAlpha: number;
  colorType: 0 | 1 | 2; // cyan, indigo, warm amber
  pulseSpeed: number;
}

interface WaveLayer {
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  yOffset: number;
  height: number;
  strokeWidth: number;
  glowBlur: number;
}

export function LiveBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width || 1)));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / (rect.height || 1)));
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth || 1200;
    let height = window.innerHeight || 800;
    let dpr = 1;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || window.innerWidth || 1200;
      height = rect.height || window.innerHeight || 800;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Seed synaptic particles for the neural constellation
    const particleCount = 44;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.1 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.32,
      vy: -0.15 - Math.random() * 0.42,
      alpha: 0.25 + Math.random() * 0.65,
      targetAlpha: 0.35 + Math.random() * 0.65,
      colorType: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      pulseSpeed: 0.012 + Math.random() * 0.02,
    }));

    // 4 harmonic Aceternity-style neural waves
    const waves: WaveLayer[] = [
      {
        amplitude: 55,
        frequency: 0.0018,
        speed: 0.0007,
        phase: 0,
        yOffset: 0.22,
        height: 320,
        strokeWidth: 1.8,
        glowBlur: 14,
      },
      {
        amplitude: 75,
        frequency: 0.0013,
        speed: 0.00055,
        phase: Math.PI / 3,
        yOffset: 0.44,
        height: 360,
        strokeWidth: 2.2,
        glowBlur: 16,
      },
      {
        amplitude: 65,
        frequency: 0.0019,
        speed: -0.00065,
        phase: Math.PI / 1.7,
        yOffset: 0.68,
        height: 330,
        strokeWidth: 1.6,
        glowBlur: 12,
      },
      {
        amplitude: 85,
        frequency: 0.0011,
        speed: 0.00045,
        phase: Math.PI / 1.2,
        yOffset: 0.88,
        height: 380,
        strokeWidth: 2.0,
        glowBlur: 14,
      },
    ];

    let lastTime = performance.now();
    let isVisible = true;

    const handleVisibility = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) lastTime = performance.now();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const render = (currentTime: number) => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min(currentTime - lastTime, 64);
      lastTime = currentTime;

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      const isDark =
        typeof document !== "undefined"
          ? document.documentElement.classList.contains("dark")
          : mounted
          ? resolvedTheme === "dark"
          : true;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Aceternity Neural Wave Ribbons with glowing laser strokes
      waves.forEach((wave, i) => {
        if (!prefersReducedMotion) {
          wave.phase += wave.speed * dt;
        }

        const baseY = height * wave.yOffset + (mouseRef.current.y - 0.5) * 40 * (i % 2 === 0 ? 1 : -1);
        const waveHeight = wave.height;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, baseY);

        const step = 16;
        for (let x = 0; x <= width + step; x += step) {
          const mouseInfluence = Math.sin((x / width) * Math.PI) * (mouseRef.current.x - 0.5) * 28;
          const y =
            baseY +
            Math.sin(x * wave.frequency + wave.phase) * wave.amplitude +
            Math.cos(x * wave.frequency * 0.55 + wave.phase * 0.75) * (wave.amplitude * 0.45) +
            mouseInfluence;
          ctx.lineTo(x, y);
        }

        // Stroke with luminous glow
        ctx.shadowBlur = isDark ? wave.glowBlur : wave.glowBlur * 0.6;
        if (isDark) {
          if (i === 0) {
            ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
            ctx.shadowColor = "rgba(6, 182, 212, 0.65)";
          } else if (i === 1) {
            ctx.strokeStyle = "rgba(99, 102, 241, 0.42)";
            ctx.shadowColor = "rgba(99, 102, 241, 0.60)";
          } else if (i === 2) {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.38)";
            ctx.shadowColor = "rgba(56, 189, 248, 0.55)";
          } else {
            ctx.strokeStyle = "rgba(168, 85, 247, 0.35)";
            ctx.shadowColor = "rgba(168, 85, 247, 0.50)";
          }
        } else {
          if (i === 0) {
            ctx.strokeStyle = "rgba(8, 145, 178, 0.38)";
            ctx.shadowColor = "rgba(8, 145, 178, 0.45)";
          } else if (i === 1) {
            ctx.strokeStyle = "rgba(99, 102, 241, 0.32)";
            ctx.shadowColor = "rgba(99, 102, 241, 0.40)";
          } else if (i === 2) {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.34)";
            ctx.shadowColor = "rgba(56, 189, 248, 0.38)";
          } else {
            ctx.strokeStyle = "rgba(245, 158, 11, 0.28)";
            ctx.shadowColor = "rgba(245, 158, 11, 0.35)";
          }
        }
        ctx.lineWidth = wave.strokeWidth;
        ctx.stroke();

        // Fill translucent wave body below the wave line
        ctx.shadowBlur = 0;
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const fillGradient = ctx.createLinearGradient(0, baseY - wave.amplitude, 0, baseY + waveHeight);

        if (isDark) {
          if (i === 0) {
            fillGradient.addColorStop(0, "rgba(6, 182, 212, 0.16)");
            fillGradient.addColorStop(0.4, "rgba(20, 184, 166, 0.06)");
            fillGradient.addColorStop(1, "rgba(6, 182, 212, 0)");
          } else if (i === 1) {
            fillGradient.addColorStop(0, "rgba(99, 102, 241, 0.13)");
            fillGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.05)");
            fillGradient.addColorStop(1, "rgba(99, 102, 241, 0)");
          } else if (i === 2) {
            fillGradient.addColorStop(0, "rgba(14, 165, 233, 0.12)");
            fillGradient.addColorStop(0.5, "rgba(6, 182, 212, 0.04)");
            fillGradient.addColorStop(1, "rgba(14, 165, 233, 0)");
          } else {
            fillGradient.addColorStop(0, "rgba(168, 85, 247, 0.11)");
            fillGradient.addColorStop(0.5, "rgba(99, 102, 241, 0.04)");
            fillGradient.addColorStop(1, "rgba(168, 85, 247, 0)");
          }
        } else {
          if (i === 0) {
            fillGradient.addColorStop(0, "rgba(6, 182, 212, 0.14)");
            fillGradient.addColorStop(0.35, "rgba(56, 189, 248, 0.06)");
            fillGradient.addColorStop(1, "rgba(6, 182, 212, 0)");
          } else if (i === 1) {
            fillGradient.addColorStop(0, "rgba(99, 102, 241, 0.11)");
            fillGradient.addColorStop(0.45, "rgba(168, 85, 247, 0.04)");
            fillGradient.addColorStop(1, "rgba(99, 102, 241, 0)");
          } else if (i === 2) {
            fillGradient.addColorStop(0, "rgba(56, 189, 248, 0.12)");
            fillGradient.addColorStop(0.45, "rgba(6, 182, 212, 0.04)");
            fillGradient.addColorStop(1, "rgba(56, 189, 248, 0)");
          } else {
            fillGradient.addColorStop(0, "rgba(251, 146, 60, 0.09)");
            fillGradient.addColorStop(0.45, "rgba(244, 114, 182, 0.03)");
            fillGradient.addColorStop(1, "rgba(251, 146, 60, 0)");
          }
        }

        ctx.fillStyle = fillGradient;
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw synaptic connection filaments between near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 105) {
            const lineAlpha = (1 - dist / 105) * 0.24;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(6, 182, 212, ${lineAlpha})`
              : `rgba(14, 116, 144, ${lineAlpha * 1.35})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // 3. Draw drifting synaptic stardust nodes
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y += p.vy;
          p.x += p.vx + (mouseRef.current.x - 0.5) * 0.22;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          p.alpha += (p.targetAlpha - p.alpha) * p.pulseSpeed;
          if (Math.abs(p.targetAlpha - p.alpha) < 0.02) {
            p.targetAlpha = 0.25 + Math.random() * 0.65;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (isDark) {
          if (p.colorType === 0) {
            ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha * 0.95})`;
          } else if (p.colorType === 1) {
            ctx.fillStyle = `rgba(165, 180, 252, ${p.alpha * 0.90})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.80})`;
          }
        } else {
          if (p.colorType === 0) {
            ctx.fillStyle = `rgba(8, 145, 178, ${p.alpha * 0.90})`;
          } else if (p.colorType === 1) {
            ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha * 0.80})`;
          } else {
            ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha * 0.75})`;
          }
        }

        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [mounted, resolvedTheme]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      suppressHydrationWarning
      className={`fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-opacity duration-1000 ${className}`}
    >
      {/* ─────────────────────────────────────────────────────────────
          Aceternity Aurora Ambient Glow Layers (CSS Hardware Accelerated)
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Aurora Wave Band 1 */}
        <div
          className="absolute -inset-2.5 opacity-60 dark:opacity-50 blur-[70px] md:blur-[110px] animate-aurora will-change-transform"
          style={{
            backgroundImage: `repeating-linear-gradient(115deg, rgba(6,182,212,0.35) 0%, rgba(99,102,241,0.28) 18%, rgba(56,189,248,0.32) 36%, rgba(168,85,247,0.22) 54%, rgba(6,182,212,0.35) 72%)`,
            backgroundSize: "300% 200%",
          }}
        />

        {/* Animated Aurora Wave Band 2 (Counter-drift for organic fluidity) */}
        <div
          className="absolute -inset-2.5 opacity-45 dark:opacity-40 blur-[80px] md:blur-[120px] animate-aurora will-change-transform"
          style={{
            backgroundImage: `repeating-linear-gradient(245deg, rgba(99,102,241,0.30) 0%, rgba(20,184,166,0.25) 20%, rgba(14,165,233,0.28) 40%, rgba(245,158,11,0.18) 60%, rgba(99,102,241,0.30) 80%)`,
            backgroundSize: "280% 220%",
            animationDirection: "reverse",
            animationDuration: "50s",
          }}
        />

        {/* Top-down Luminous Ambient Aura Wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(6,182,212,0.28),rgba(99,102,241,0.14),transparent_75%)] dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(6,182,212,0.25),transparent_75%)]" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Dynamic Aceternity Neural Waves & Synaptic Constellation Canvas
          ───────────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* ─────────────────────────────────────────────────────────────
          Vignette & Micro Cyber-Grid Contrast Protection Mask
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 subtle-grid opacity-50 dark:opacity-35 mask-[radial-gradient(ellipse_at_center,transparent_25%,black_90%)]" />

      {/* Central Reading Contrast Gradient (Keeps hero & text perfectly crisp) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,var(--background)_95%)] opacity-35 dark:opacity-40" />
    </div>
  );
}
