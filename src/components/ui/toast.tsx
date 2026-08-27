"use client";
import { createContext, useContext, useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastCtx = createContext<ToastContextType>({
  toast: () => {},
});

export const useToast = () => useContext(ToastCtx);

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

declare global {
  interface Window {
    __pp_toast?: (message: string, type?: ToastType) => void;
  }
}

const emptySubscribe = () => () => {};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__pp_toast = toast;
    }
  }, [toast]);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {mounted && (
        <div
          suppressHydrationWarning
          className="fixed bottom-5 right-5 z-[9999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl text-xs font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
                t.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50"
                  : t.type === "error"
                  ? "bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50"
                  : "bg-slate-900/90 border-blue-500/40 text-slate-100 shadow-slate-950/50"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    t.type === "success"
                      ? "text-emerald-400"
                      : t.type === "error"
                      ? "text-rose-400"
                      : "text-blue-400"
                  }`}
                />
                <span className="leading-snug break-words">{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-muted-foreground hover:text-foreground shrink-0 p-1 rounded-md transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
