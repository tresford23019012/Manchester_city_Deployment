import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  askReason?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

// Temporary dialog built on the native <dialog> element (focus trap and Esc come free).
// Swap for W1's Modal when it lands.
export default function ConfirmDialog(props: Props) {
  const { open, title, message, confirmLabel, danger, askReason, onConfirm, onCancel } = props;
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setReason("");
      el.showModal();
    }
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="w3r-dialog"
      aria-labelledby="w3r-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id="w3r-dialog-title">{title}</h2>
      <p>{message}</p>
      {askReason && (
        <label className="w3r-field">
          <span>Reason (optional)</span>
          <textarea rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      )}
      <div className="w3r-dialog__actions">
        <button type="button" className="w3r-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={`w3r-btn ${danger ? "w3r-btn--danger" : "w3r-btn--primary"}`}
          onClick={() => onConfirm(reason.trim())}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
