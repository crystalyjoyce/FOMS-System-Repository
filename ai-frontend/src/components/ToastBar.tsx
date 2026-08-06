import React from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import { useToast, Toast } from "./ToastContext";
import "./ToastBar.css";

export const ToastBar: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  const handleAction = (toast: Toast) => {
    if (toast.onAction) {
      toast.onAction();
    }
    dismissToast(toast.id);
  };

  return (
    <div
      className="tb-toast-wrapper"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      role="region"
    >
      {toasts.map((toast) => {
        const isPersistent = toast.type === "error" && toast.duration === undefined;
        const showProgress = !isPersistent && toast.duration !== 0;
        const durationMs = toast.duration !== undefined ? toast.duration : (toast.type === "warning" ? 6000 : 4000);

        return (
          <div
            key={toast.id}
            className={`tb-toast-item tb-${toast.type} ${
              toast.isLeaving ? "tb-toast-leave" : "tb-toast-enter"
            }`}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
            aria-atomic="true"
          >
            <div className="tb-toast-icon">
              {toast.type === "success" && <CheckCircle2 size={18} strokeWidth={2.5} />}
              {toast.type === "info" && <Info size={18} strokeWidth={2.5} />}
              {toast.type === "warning" && <AlertTriangle size={18} strokeWidth={2.5} />}
              {toast.type === "error" && <XCircle size={18} strokeWidth={2.5} />}
            </div>
            <div className="tb-toast-content">
              <h4 className="tb-toast-title">{toast.title}</h4>
              <p className="tb-toast-msg">{toast.message}</p>
              {toast.actionLabel && (
                <button
                  className="tb-toast-action-btn"
                  onClick={() => handleAction(toast)}
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
            <button
              className="tb-toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Close notification"
            >
              ✕
            </button>

            {showProgress && durationMs > 0 && (
              <div 
                className="tb-toast-progress" 
                style={{ animationDuration: `${durationMs}ms` }} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ToastBar;
