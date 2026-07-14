"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "danger" | "warning";
}

interface ToastContextValue {
  toast: (t: Omit<ToastMessage, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((t: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "glass-strong rounded-2xl p-4 shadow-glass pointer-events-auto",
              "animate-slide-up",
              t.tone === "success" && "border-success/40",
              t.tone === "danger" && "border-danger/40",
              t.tone === "warning" && "border-warning/40"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "h-2 w-2 rounded-full mt-1.5",
                  t.tone === "success" && "bg-success",
                  t.tone === "danger" && "bg-danger",
                  t.tone === "warning" && "bg-warning",
                  (!t.tone || t.tone === "default") && "bg-primary"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-muted mt-0.5">{t.description}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
