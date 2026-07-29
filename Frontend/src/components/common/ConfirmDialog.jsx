import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";

export function ConfirmDialog({ open, title, description, confirmLabel = "Delete", busy = false, onConfirm, onClose }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--focus-overlay)] px-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section
        className="focus-room-elevated w-full max-w-md rounded-[var(--focus-radius-xl)] border p-6 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-confirm-title"
        aria-describedby="focus-confirm-description"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--focus-radius-md)] bg-red-400/10 text-red-300">
            <Trash2 className="h-5 w-5" />
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="focus-room-control rounded-lg p-2 text-[var(--focus-text-secondary)] hover:bg-white/10 hover:text-white" aria-label="Close confirmation dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 id="focus-confirm-title" className="mt-5 text-xl font-bold">{title}</h2>
        <p id="focus-confirm-description" className="mt-2 text-sm leading-6 text-[var(--focus-text-secondary)]">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className="focus-room-control inline-flex h-10 items-center justify-center rounded-md border border-[var(--focus-border-strong)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--focus-accent-subtle)] disabled:pointer-events-none disabled:opacity-50">
            Cancel
          </button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
