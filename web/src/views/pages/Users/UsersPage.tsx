import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/Requests/ConfirmDialog";
import { Toasts, useToasts } from "../../components/Requests/Toasts";
import { blockUser, unblockUser } from "../../../models/services/w3/usersApi";
import type { ManagedUser } from "../../../models/services/w3/userTypes";
import { useUsers } from "../../../controllers/Users/useUsers";
import "../Requests/requests.css"; // shared W3 tokens, buttons, table and dialog styles
import "./users.css";

type Filter = "all" | "guest" | "owner" | "overdue" | "blocked";
type DialogState = { kind: "block" | "unblock"; user: ManagedUser } | null;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "guest", label: "Guests" },
  { key: "owner", label: "Owners" },

  { key: "blocked", label: "Blocked" },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function matches(u: ManagedUser, filter: Filter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "guest":
      return u.role === "guest";
    case "owner":
      return u.role === "owner";
    case "overdue":
      return u.paymentStatus === "overdue";
    case "blocked":
      return u.status === "blocked";
  }
}

export default function UsersPage() {
  const { items, loading, error, busy, reload, mutate } = useUsers();
  const { toasts, push } = useToasts();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, guest: 0, owner: 0, overdue: 0, blocked: 0 };
    (items ?? []).forEach((u) => {
      (Object.keys(c) as Filter[]).forEach((k) => {
        if (matches(u, k)) c[k]++;
      });
    });
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = (items ?? []).filter(
      (u) => matches(u, filter) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
    // Most overdue first on the overdue tab, so the owners to act on are at the top.
    return rows.sort((a, b) => (filter === "overdue" ? b.overdueDays - a.overdueDays : a.name.localeCompare(b.name)));
  }, [items, filter, query]);

  async function onConfirm(reason: string) {
    if (!dialog) return;
    const { kind, user } = dialog;
    setDialog(null);

    let result;
    if (kind === "block") {
      const why = reason || (user.paymentStatus === "overdue" ? "Overdue payment" : "");
      result = await mutate(
        user.id,
        { status: "blocked", blockReason: why || null, blockedAt: new Date().toISOString() },
        () => blockUser(user.id, why),
      );
    } else {
      result = await mutate(user.id, { status: "active", blockReason: null, blockedAt: null }, () =>
        unblockUser(user.id),
      );
    }

    if (result.ok) push("success", `${kind === "block" ? "Blocked" : "Unblocked"} ${user.name}`);
    else push("error", `Could not ${kind} ${user.name}. ${result.message}`);
  }

  const filterLabel = FILTERS.find((f) => f.key === filter)?.label.toLowerCase() ?? "";

  return (
    <div className="w3r">
      <header className="w3r-header">
        <div>
          <h1>Users</h1>
          <p className="w3r-sub">View customer and owner accounts, and manage access</p>
        </div>
        <Link className="w3r-btn" to="/admin/users/new-admin">
          Create admin
        </Link>
      </header>

      {loading && !items && (
        <div role="status" aria-label="Loading users" className="w3r-card">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w3r-skel" style={{ height: 40, marginBottom: 12 }} />
          ))}
        </div>
      )}

      {error && !items && (
        <div className="w3r-state" role="alert">
          <h2>Users did not load</h2>
          <p>{error}</p>
          <button className="w3r-btn" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {items && (
        <>
          <div className="w3r-toolbar">
            <div className="w3r-filters">
              {FILTERS.map((f) => (
                <button key={f.key} className="w3r-chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                  {f.label} ({counts[f.key]})
                </button>
              ))}
            </div>
            <input
              className="w3r-input"
              type="search"
              placeholder="Search name or email"
              aria-label="Search users"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {visible.length === 0 ? (
            <div className="w3r-state">
              {query ? (
                <>
                  <h2>No users match your search</h2>
                  <p>Try a different name or clear the search box.</p>
                </>
              ) : items.length === 0 ? (
                <>
                  <h2>No users yet</h2>
                  <p>Guests and owners appear here once they register.</p>
                </>
              ) : (
                <>
                  <h2>No {filterLabel} users</h2>
                  <p>Nothing matches this view right now.</p>
                </>
              )}
            </div>
          ) : (
            <div className="w3r-tablewrap">
              <table className="w3r-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((u) => {
                    const isBusy = busy.has(u.id);
                    return (
                      <tr key={u.id}>
                        <td>
                          {u.name}
                          <div className="w3r-sub">{u.email}</div>
                        </td>
                        <td>{u.role === "owner" ? "Owner" : "Guest"}</td>
                        <td>
                          <span className={`w3r-badge w3r-badge--${u.status}`}>{u.status === "blocked" ? "Blocked" : "Active"}</span>
                          {u.status === "blocked" && u.blockReason && <div className="w3r-sub">{u.blockReason}</div>}
                        </td>
                        <td>
                          {u.status === "active" ? (
                            <button
                              className="w3r-btn w3r-btn--danger"
                              disabled={isBusy}
                              aria-label={`Block ${u.name}`}
                              onClick={() => setDialog({ kind: "block", user: u })}
                            >
                              Block
                            </button>
                          ) : (
                            <button
                              className="w3r-btn"
                              disabled={isBusy}
                              aria-label={`Unblock ${u.name}`}
                              onClick={() => setDialog({ kind: "unblock", user: u })}
                            >
                              Unblock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.kind === "unblock" ? `Unblock ${dialog.user.name}?` : `Block ${dialog?.user.name ?? ""}?`}
        message={
          dialog?.kind === "unblock"
            ? "This owner will be active again."
            : dialog?.user.paymentStatus === "overdue"
              ? `${dialog.user.name} is ${plural(dialog.user.overdueDays, "day")} overdue on payment. The owner stays blocked until you unblock them.`
              : "The owner stays blocked until you unblock them."
        }
        confirmLabel={dialog?.kind === "unblock" ? "Unblock" : "Block"}
        danger={dialog?.kind !== "unblock"}
        askReason={false}
        onConfirm={onConfirm}
        onCancel={() => setDialog(null)}
      />
      <Toasts toasts={toasts} />
    </div>
  );
}
