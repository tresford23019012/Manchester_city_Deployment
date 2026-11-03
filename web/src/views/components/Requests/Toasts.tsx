import { useCallback, useRef, useState } from "react";

export type ToastItem = { id: number; kind: "success" | "error"; text: string };

// Temporary toasts. Swap for W1's Toast when it lands.
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((kind: ToastItem["kind"], text: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  return { toasts, push };
}

export function Toasts({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="w3r-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`w3r-toast w3r-toast--${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
