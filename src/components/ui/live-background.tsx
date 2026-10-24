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

    // Seed 42 energetic particles with guaranteed minimum
    const particleCount = 42;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.2 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.2 - Math.random() * 0.45,
      alpha: 0.25 + Math.random() * 0.6,
      targetAlpha: 0.4 + Math.random() * 0.6,
      colorType: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }));

    // Wave layers definitions (3 fluid energy ribbons)
    const waves: WaveLayer[] = [
      {
        amplitude: 65,
        frequency: 0.0016,
        speed: 0.0008,
        phase: 0,
        yOffset: 0.2,
        height: 320,
      },
      {
        amplitude: 80,
        frequency: 0.0012,
        speed: 0.0006,
        phase: Math.PI / 3,
        yOffset: 0.45,
        height: 360,
      },
      {
        amplitude: 70,
        frequency: 0.0018,
        speed: -0.0007,
        phase: Math.PI / 1.8,
        yOffset: 0.74,
        height: 340,
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

      const isDark = mounted ? resolvedTheme === "dark" : true;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw flowing multi-frequency wave ribbons
      waves.forEach((wave, i) => {
        if (!prefersReducedMotion) {
          wave.phase += wave.speed * dt;
        }

        const baseY = height * wave.yOffset + (mouseRef.current.y - 0.5) * 45 * (i % 2 === 0 ? 1 : -1);
        const waveHeight = wave.height;

        ctx.beginPath();
        ctx.moveTo(0, baseY);

        const step = 20;
        for (let x = 0; x <= width + step; x += step) {
          const mouseInfluence = Math.sin((x / width) * Math.PI) * (mouseRef.current.x - 0.5) * 25;
          const y =
            baseY +
            Math.sin(x * wave.frequency + wave.phase) * wave.amplitude +
            Math.cos(x * wave.frequency * 0.6 + wave.phase * 0.7) * (wave.amplitude * 0.45) +
            mouseInfluence;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, baseY - wave.amplitude, 0, baseY + waveHeight);

        if (isDark) {
          if (i === 0) {
            gradient.addColorStop(0, "rgba(6, 182, 212, 0.22)");
            gradient.addColorStop(0.4, "rgba(20, 184, 166, 0.09)");
            gradient.addColorStop(1, "rgba(6, 182, 212, 0)");
          } else if (i === 1) {
            gradient.addColorStop(0, "rgba(99, 102, 241, 0.18)");
            gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.07)");
            gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
          } else {
            gradient.addColorStop(0, "rgba(14, 165, 233, 0.16)");
            gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.06)");
            gradient.addColorStop(1, "rgba(14, 165, 233, 0)");
          }
        } else {
          if (i === 0) {
            gradient.addColorStop(0, "rgba(6, 182, 212, 0.20)");
            gradient.addColorStop(0.35, "rgba(56, 189, 248, 0.09)");
            gradient.addColorStop(1, "rgba(6, 182, 212, 0)");
          } else if (i === 1) {
            gradient.addColorStop(0, "rgba(99, 102, 241, 0.16)");
            gradient.addColorStop(0.45, "rgba(168, 85, 247, 0.06)");
            gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
          } else {
            gradient.addColorStop(0, "rgba(251, 146, 60, 0.14)");
            gradient.addColorStop(0.45, "rgba(244, 114, 182, 0.05)");
            gradient.addColorStop(1, "rgba(251, 146, 60, 0)");
          }
        }

        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // 2. Draw constellation connection threads between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(6, 182, 212, ${lineAlpha})`
              : `rgba(14, 116, 144, ${lineAlpha * 1.3})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Draw drifting stardust micro-particles
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y += p.vy;
          p.x += p.vx + (mouseRef.current.x - 0.5) * 0.2;

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
            ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha * 0.9})`;
          } else if (p.colorType === 1) {
            ctx.fillStyle = `rgba(165, 180, 252, ${p.alpha * 0.85})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.75})`;
          }
        } else {
          if (p.colorType === 0) {
            ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha * 0.85})`;
          } else if (p.colorType === 1) {
            ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha * 0.75})`;
          } else {
            ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha * 0.7})`;
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
      className={`fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-opacity duration-700 ${className}`}
    >
      {/* Top-down Luminous Ambient Aura Wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_75%_at_50%_-15%,rgba(6,182,212,0.22),rgba(99,102,241,0.12),transparent_75%)] dark:bg-[radial-gradient(ellipse_100%_75%_at_50%_-15%,rgba(6,182,212,0.20),transparent_75%)]" />

      {/* Dynamic Hardware Canvas Waves & Constellation Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Layered Subtle Cyber Grid with Vignette Mask */}
      <div className="absolute inset-0 subtle-grid opacity-60 dark:opacity-45" />

      {/* Radiant Prismatic Ambient Aurora Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top Hero Radiant Prismatic Orb */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-180 h-130 rounded-full bg-linear-to-b from-cyan-400/28 via-sky-300/18 to-transparent dark:bg-cyan-400/20 blur-[110px] animate-drift" />

        {/* Top-Right Secondary Orb */}
        <div className="absolute top-24 -right-20 w-110 h-110 rounded-full bg-linear-to-tr from-indigo-400/22 via-purple-300/14 to-transparent dark:bg-indigo-500/16 blur-[100px] animate-drift-reverse" />

        {/* Top-Left Ambient Sunrise Warmth Orb */}
        <div className="absolute top-48 -left-20 w-105 h-105 rounded-full bg-linear-to-br from-amber-300/18 via-rose-300/12 to-transparent dark:bg-teal-400/14 blur-[100px] animate-drift-slow" />

        {/* Mid-Page Ambient Light Ribbon */}
        <div className="absolute top-[40%] -right-24 w-120 h-100 rounded-full bg-linear-to-r from-sky-400/18 via-cyan-300/12 to-transparent dark:bg-sky-400/14 blur-[110px] animate-drift" />

        {/* Bottom Radiant Accent */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-175 h-110 rounded-full bg-linear-to-t from-cyan-400/24 via-indigo-300/14 to-transparent dark:bg-cyan-400/16 blur-[110px] animate-drift-slow" />
      </div>
    </div>
  );
}
