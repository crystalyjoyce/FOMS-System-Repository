import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  isLeaving: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastContextValue {
  toasts: Toast[];
  triggerToast: (
    type: ToastType,
    title: string,
    message: string,
    actionLabel?: string,
    onAction?: () => void
  ) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const triggerToast = useCallback(
    (
      type: ToastType,
      title: string,
      message: string,
      actionLabel?: string,
      onAction?: () => void
    ) => {
      const id = Date.now() + Math.random();

      const newToast: Toast = {
        id,
        type,
        title,
        message,
        isLeaving: false,
        actionLabel,
        onAction,
      };

      setToasts((prev) => {
        const activeToasts = [...prev, newToast];
        
        // Priority logic: Sort errors to the top of the stack
        activeToasts.sort((a, b) => {
          if (a.type === "error" && b.type !== "error") return -1;
          if (a.type !== "error" && b.type === "error") return 1;
          return 0;
        });

        // Limit to max 3 active toasts
        if (activeToasts.length > 3) {
          const oldestNonErrorIndex = activeToasts.findIndex((t) => t.type !== "error");
          if (oldestNonErrorIndex !== -1) {
            activeToasts.splice(oldestNonErrorIndex, 1);
          } else {
            return activeToasts.slice(-3);
          }
        }
        return activeToasts;
      });

      // Auto-dismiss severity logic:
      // success/info = 4 seconds, warning = 6 seconds, error = persistent
      if (type !== "error") {
        const dismissDuration = type === "warning" ? 6000 : 4000;
        setTimeout(() => {
          dismissToast(id);
        }, dismissDuration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, triggerToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { triggerToast } = context;

  const success = useCallback(
    (message: string, title = "Success", actionLabel?: string, onAction?: () => void) => {
      triggerToast("success", title, message, actionLabel, onAction);
    },
    [triggerToast]
  );

  const error = useCallback(
    (message: string, title = "Error", actionLabel?: string, onAction?: () => void) => {
      triggerToast("error", title, message, actionLabel, onAction);
    },
    [triggerToast]
  );

  const info = useCallback(
    (message: string, title = "Info", actionLabel?: string, onAction?: () => void) => {
      triggerToast("info", title, message, actionLabel, onAction);
    },
    [triggerToast]
  );

  const warning = useCallback(
    (message: string, title = "Warning", actionLabel?: string, onAction?: () => void) => {
      triggerToast("warning", title, message, actionLabel, onAction);
    },
    [triggerToast]
  );

  return {
    toasts: context.toasts,
    dismissToast: context.dismissToast,
    triggerToast,
    toast: {
      success,
      error,
      info,
      warning,
    },
  };
};
