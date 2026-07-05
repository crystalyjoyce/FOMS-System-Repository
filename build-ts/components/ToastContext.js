import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from "react";
const ToastContext = createContext(undefined);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t)));
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);
    const triggerToast = useCallback((type, title, message, actionLabel, onAction) => {
        const id = Date.now() + Math.random();
        const newToast = {
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
                if (a.type === "error" && b.type !== "error")
                    return -1;
                if (a.type !== "error" && b.type === "error")
                    return 1;
                return 0;
            });
            // Limit to max 3 active toasts
            if (activeToasts.length > 3) {
                const oldestNonErrorIndex = activeToasts.findIndex((t) => t.type !== "error");
                if (oldestNonErrorIndex !== -1) {
                    activeToasts.splice(oldestNonErrorIndex, 1);
                }
                else {
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
    }, [dismissToast]);
    return (_jsx(ToastContext.Provider, { value: { toasts, triggerToast, dismissToast }, children: children }));
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    const { triggerToast } = context;
    const success = useCallback((message, title = "Success", actionLabel, onAction) => {
        triggerToast("success", title, message, actionLabel, onAction);
    }, [triggerToast]);
    const error = useCallback((message, title = "Error", actionLabel, onAction) => {
        triggerToast("error", title, message, actionLabel, onAction);
    }, [triggerToast]);
    const info = useCallback((message, title = "Info", actionLabel, onAction) => {
        triggerToast("info", title, message, actionLabel, onAction);
    }, [triggerToast]);
    const warning = useCallback((message, title = "Warning", actionLabel, onAction) => {
        triggerToast("warning", title, message, actionLabel, onAction);
    }, [triggerToast]);
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
//# sourceMappingURL=ToastContext.js.map