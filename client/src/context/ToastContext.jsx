import { createContext, useCallback, useMemo, useRef, useState } from "react";
import Icon from "../components/ui/Icon.jsx";

export const ToastContext = createContext(null);

const TOAST_DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message, variant = "info") => {
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
          <div key={toast.id} className={`toast toast--${toast.variant}`}>
            <span className="toast__message">{toast.message}</span>
            <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => dismiss(toast.id)}>
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
