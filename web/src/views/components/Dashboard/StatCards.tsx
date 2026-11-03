import { Link } from "react-router-dom";
import type { DashboardStats } from "../../../models/services/w3/types";

export function StatCards({ stats }: { stats: DashboardStats }) {
  const { totalGuesthouses, topCity, highestRated } = stats;

  return (
    <div className="w3-stats">
      <article className="w3-card" aria-labelledby="stat-total">
        <h2 id="stat-total" className="w3-card__label">Total guesthouses</h2>
        <p className="w3-card__value">{totalGuesthouses.toLocaleString()}</p>
        <p className="w3-card__hint">Across all cities</p>
      </article>

      <article className="w3-card" aria-labelledby="stat-city">
        <h2 id="stat-city" className="w3-card__label">City with the most guesthouses</h2>
        <p className="w3-card__value">{topCity ? topCity.name : "No data yet"}</p>
        <p className="w3-card__hint">
          {topCity ? `${topCity.count} listings` : "Appears once guesthouses are added"}
        </p>
      </article>

      <article className="w3-card" aria-labelledby="stat-rated">
        <h2 id="stat-rated" className="w3-card__label">Highest rated guesthouse</h2>
        <p className="w3-card__value w3-card__value--text">
          {highestRated ? (
            // Route belongs to W2's guesthouse pages. Confirm the path with them.
            <Link to={`/admin/guesthouses?edit=${encodeURIComponent(highestRated.id)}`}>{highestRated.name}</Link>
          ) : (
            "No data yet"
          )}
        </p>
        <p className="w3-card__hint">
          {highestRated
            ? `${highestRated.rating.toFixed(1)} out of 5`
            : "Appears once guesthouses are rated"}
        </p>
      </article>
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="w3-stats" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div className="w3-card" key={i}>
          <div className="w3-skel" style={{ width: "55%", height: 14 }} />
          <div className="w3-skel" style={{ width: "40%", height: 32, marginTop: 14 }} />
          <div className="w3-skel" style={{ width: "65%", height: 12, marginTop: 14 }} />
        </div>
      ))}
    </div>
  );
}