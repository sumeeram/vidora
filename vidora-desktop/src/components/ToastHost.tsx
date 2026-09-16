import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useApp } from "../store/app";
import { springs } from "../motion/tokens";

export function ToastHost() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismiss(toast.id), 5600),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [toasts, dismiss]);

  return (
    <div className="toast toast-end z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={springs.snappy}
            className="alert glass shadow-lg max-w-sm"
          >
            <div>
              <p className="font-display text-sm">{toast.title}</p>
              {toast.body ? (
                <p className="text-caption opacity-70 truncate max-w-[240px]">
                  {toast.body}
                </p>
              ) : null}
            </div>
            {toast.actionLabel ? (
              <button
                className="btn btn-primary btn-xs"
                onClick={() => {
                  toast.onAction?.();
                  dismiss(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            ) : (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => dismiss(toast.id)}
              >
                Close
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
