import { useCallback, useEffect, useRef, useState } from "react";
import { getDashboard } from "../../models/services/w3/w3Api";
import type { DashboardData } from "../../models/services/w3/types";

/**
 * Loads dashboard data.
 * pollMs is optional: pass e.g. 30000 to refresh quietly every 30 seconds.
 * Task 81 (real-time) can replace polling later without touching the page.
 */
export function useDashboard(pollMs?: number) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0); // ignore responses from outdated requests

  const load = useCallback(async (silent = false) => {
    const id = ++latest.current;
    if (!silent) setLoading(true);
    try {
      const result = await getDashboard();
      if (id !== latest.current) return;
      setData(result);
      setError(null);
    } catch (e) {
      if (id !== latest.current) return;
      if (!silent) setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      latest.current++;
    };
  }, [load]);

  useEffect(() => {
    if (!pollMs) return;
    const t = setInterval(() => load(true), pollMs);
    return () => clearInterval(t);
  }, [pollMs, load]);

  return { data, loading, error, refetch: () => load() };
}