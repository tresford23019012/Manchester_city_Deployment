import { useCallback, useEffect, useState } from "react";
import { listRequests } from "../../models/services/w3/requestsApi";
import type { ActionResult, OwnerRequest } from "../../models/services/w3/requestTypes";
import { errorMessage } from "../../models/utils/Requests/format";

// Loads the list and applies changes optimistically:
// the row updates at once, then rolls back if the server refuses.
export function useRequests() {
  const [items, setItems] = useState<OwnerRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listRequests());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mutate = useCallback(
    async (id: string, optimistic: Partial<OwnerRequest>, call: () => Promise<OwnerRequest>): Promise<ActionResult> => {
      const previous = items?.find((r) => r.id === id);
      if (!previous || busy.has(id)) return { ok: false, message: "This request is already being updated." };

      setBusy((s) => new Set(s).add(id));
      setItems((cur) => cur && cur.map((r) => (r.id === id ? { ...r, ...optimistic } : r)));
      try {
        const saved = await call();
        setItems((cur) => cur && cur.map((r) => (r.id === id ? saved : r)));
        return { ok: true };
      } catch (e) {
        setItems((cur) => cur && cur.map((r) => (r.id === id ? previous : r)));
        return { ok: false, message: errorMessage(e) };
      } finally {
        setBusy((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
      }
    },
    [items, busy],
  );

  return { items, loading, error, busy, reload: load, mutate };
}
