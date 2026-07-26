"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { X, Check, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastCtx = createContext<{ toast: (message: string, type?: ToastType) => void }>({ toast: () => {} });

export const useToast = () => useContext(ToastCtx);

const icons: Record<ToastType, typeof Check> = { success: Check, error: AlertCircle, info: Info };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className="flex items-start gap-2 p-3 rounded-lg border bg-background shadow-lg text-sm animate-in slide-in-from-right">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${t.type === "success" ? "text-green-600" : t.type === "error" ? "text-red-600" : "text-blue-600"}`} />
              <p className="text-xs flex-1">{t.message}</p>
              <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
