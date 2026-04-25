import type { ToastState } from "../hooks/useToast";
import { XIcon } from "./ui/icons";

type ToastProps = {
  toast: ToastState;
  onDismiss: () => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className={`toast toast--${toast.tone}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span>{toast.message}</span>
      <button
        type="button"
        className="toast__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <XIcon size={12} />
      </button>
    </div>
  );
}
