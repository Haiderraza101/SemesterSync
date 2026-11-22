import { createContext, useCallback, useMemo, useRef, useState } from "react";
import Icon from "../components/ui/Icon.jsx";

export const ToastContext = createContext(null);

const TOAST_DURATION = 4000;
const TOAST_ICONS = { success: "check", danger: "alert", warning: "alert", info: "info" };
const TOAST_TITLES = { success: "Done", danger: "Something went wrong", warning: "Heads up", info: "Notice" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message, variant = "success") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.variant}`} role={toast.variant === "danger" ? "alert" : undefined}>
            <span className="toast__icon" aria-hidden="true">
              <Icon name={TOAST_ICONS[toast.variant] || "info"} size={14} strokeWidth={2.5} />
            </span>
            <div className="toast__body">
              <span className="toast__title">{TOAST_TITLES[toast.variant] || "Notice"}</span>
              <span className="toast__message">{toast.message}</span>
            </div>
            <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => dismiss(toast.id)}>
              <Icon name="close" size={14} />
            </button>
            <span className="toast__timer" style={{ animationDuration: `${TOAST_DURATION}ms` }} aria-hidden="true" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
