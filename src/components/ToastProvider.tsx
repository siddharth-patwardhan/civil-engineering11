import { useState, type ReactNode, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

let toastId = 0;
let addToastFn: ((toast: Toast) => void) | null = null;

export function showToast(message: string, type: Toast["type"] = "info") {
  if (addToastFn) {
    addToastFn({ id: String(++toastId), message, type });
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 3000);
  }, []);

  addToastFn = addToast;

  const iconMap = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };

  const colorMap = {
    success: "text-accent-success",
    error: "text-accent-danger",
    warning: "text-accent-warning",
    info: "text-accent-info",
  };

  const borderMap = {
    success: "border-accent-success/20",
    error: "border-accent-danger/20",
    warning: "border-accent-warning/20",
    info: "border-accent-info/20",
  };

  return (
    <>
      {children}
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[90] flex flex-col gap-2 pointer-events-none pt-safe">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-bg-elevated border ${borderMap[t.type]} rounded-lg shadow-lg animate-slide-up w-full sm:w-auto sm:min-w-[280px] sm:max-w-sm ml-auto`}
          >
            <span className={`material-symbols-outlined ${colorMap[t.type]}`}>{iconMap[t.type]}</span>
            <span className="font-body text-body text-text-primary">{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
