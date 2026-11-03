import { useCallback, useEffect, useState } from "react";
import { getRequest } from "../../models/services/w3/requestsApi";
import type { ActionResult, OwnerRequest } from "../../models/services/w3/requestTypes";
import { errorMessage } from "../../models/utils/Requests/format";

// Loads one request. Detail actions wait for the server, because each step
// unlocks the next one and the server decides what is allowed.
export function useRequest(id: string | undefined) {
  const [request, setRequest] = useState<OwnerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError("Request not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRequest(await getRequest(id));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = useCallback(async (call: () => Promise<OwnerRequest>): Promise<ActionResult> => {
    setWorking(true);
    try {
      setRequest(await call());
      return { ok: true };
    } catch (e) {
      return { ok: false, message: errorMessage(e) };
    } finally {
      setWorking(false);
    }
  }, []);

  return { request, loading, error, working, reload: load, run };
}
