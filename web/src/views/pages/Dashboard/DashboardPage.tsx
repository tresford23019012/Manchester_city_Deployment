import { Charts, ChartsSkeleton } from "../../components/Dashboard/Charts";
import { StatCards, StatCardsSkeleton } from "../../components/Dashboard/StatCards";
import { useDashboard } from "../../../controllers/Dashboard/useDashboard";
import "./Dashboard.css";

export default function DashboardPage() {
  // Pass a number of milliseconds to refresh quietly, e.g. useDashboard(30000).
  const { data, loading, error, refetch } = useDashboard();

  const isEmpty = data !== null && data.stats.totalGuesthouses === 0;

  return (
    <div className="w3-dashboard">
      <header className="w3-header">
        <div>
          <h1>Dashboard</h1>
          <p className="w3-card__hint">How guesthouse listings are performing</p>
        </div>
        {/* Swap for W1's Button when it lands */}
        <button className="w3-btn" onClick={refetch} disabled={loading}>
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </header>

      {loading && !data && (
        <div role="status" aria-label="Loading dashboard">
          <StatCardsSkeleton />
          <ChartsSkeleton />
        </div>
      )}

      {error && data && <p role="alert">Could not refresh: {error}. Previously loaded data is shown.</p>}
      {error && !data && (
        <div className="w3-state" role="alert">
          <h2>Dashboard did not load</h2>
          <p>{error}</p>
          <button className="w3-btn" onClick={refetch}>Try again</button>
        </div>
      )}

      {isEmpty && (
        <div className="w3-state">
          <h2>No guesthouses yet</h2>
          <p>Stats and charts appear here once guesthouses are added.</p>
        </div>
      )}

      {data && !isEmpty && (
        <>
          <StatCards stats={data.stats} />
          <Charts data={data} />
        </>
      )}
    </div>
  );
}