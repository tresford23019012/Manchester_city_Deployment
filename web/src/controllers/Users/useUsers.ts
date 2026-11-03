import { useCallback, useEffect, useState } from "react";
import { listUsers } from "../../models/services/w3/usersApi";
import type { ActionResult } from "../../models/services/w3/requestTypes";
import type { ManagedUser } from "../../models/services/w3/userTypes";
import { errorMessage } from "../../models/utils/Requests/format";

// Loads users and applies block / unblock optimistically:
// the row changes at once, then rolls back if the server refuses.
export function useUsers() {
  const [items, setItems] = useState<ManagedUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listUsers());
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
    async (id: string, optimistic: Partial<ManagedUser>, call: () => Promise<ManagedUser>): Promise<ActionResult> => {
      const previous = items?.find((u) => u.id === id);
      if (!previous || busy.has(id)) return { ok: false, message: "This user is already being updated." };

      setBusy((s) => new Set(s).add(id));
      setItems((cur) => cur && cur.map((u) => (u.id === id ? { ...u, ...optimistic } : u)));
      try {
        const saved = await call();
        setItems((cur) => cur && cur.map((u) => (u.id === id ? saved : u)));
        return { ok: true };
      } catch (e) {
        setItems((cur) => cur && cur.map((u) => (u.id === id ? previous : u)));
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
