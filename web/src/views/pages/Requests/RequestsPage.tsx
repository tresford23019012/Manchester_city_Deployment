import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/Requests/ConfirmDialog";
import StatusBadge from "../../components/Requests/StatusBadge";
import { Toasts, useToasts } from "../../components/Requests/Toasts";
import { approveRequest, rejectRequest } from "../../../models/services/w3/requestsApi";
import type { OwnerRequest, RequestStatus } from "../../../models/services/w3/requestTypes";
import { fmtDate } from "../../../models/utils/Requests/format";
import { useRequests } from "../../../controllers/Requests/useRequests";
import "./requests.css";

type Filter = "all" | RequestStatus;
type DialogState = { kind: "approve" | "reject"; request: OwnerRequest } | null;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rep_dispatched", label: "Rep dispatched" },
  { key: "data_collected", label: "Data collected" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function RequestsPage() {
  const { items, loading, error, busy, reload, mutate } = useRequests();
  const { toasts, push } = useToasts();
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, rep_dispatched: 0, data_collected: 0, pending: 0, approved: 0, rejected: 0, published: 0 };
    (items ?? []).forEach((r) => {
      c.all++;
      c[r.status]++;
    });
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = (items ?? []).filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q || [r.ownerName, r.email, r.guesthouseName, r.city].some((v) => v.toLowerCase().includes(q))),
    );
    // Review the oldest pending request first; show everything else newest first.
    const dir = filter === "pending" ? 1 : -1;
    return rows.sort((a, b) => dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, [items, filter, query]);

  async function onConfirm(reason: string) {
    if (!dialog) return;
    const { kind, request } = dialog;
    setDialog(null);
    const result =
      kind === "approve"
        ? await mutate(request.id, { status: "approved" }, () => approveRequest(request.id))
        : await mutate(request.id, { status: "rejected", rejectReason: reason || null }, () =>
            rejectRequest(request.id, reason),
          );
    if (result.ok) {
      push("success", `${kind === "approve" ? "Approved" : "Rejected"} ${request.guesthouseName}`);
    } else {
      push("error", `Could not ${kind} ${request.guesthouseName}. ${result.message}`);
    }
  }

  const filterLabel = FILTERS.find((f) => f.key === filter)?.label.toLowerCase() ?? "";

  return (
    <div className="w3r">
      <header className="w3r-header">
        <div>
          <h1>Owner requests</h1>
          <p className="w3r-sub">Review owner registrations and move them toward publishing</p>
        </div>
      </header>

      {loading && !items && (
        <div role="status" aria-label="Loading requests" className="w3r-card">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w3r-skel" style={{ height: 40, marginBottom: 12 }} />
          ))}
        </div>
      )}

      {error && !items && (
        <div className="w3r-state" role="alert">
          <h2>Requests did not load</h2>
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
                <button
                  key={f.key}
                  className="w3r-chip"
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label} ({counts[f.key]})
                </button>
              ))}
            </div>
            <input
              className="w3r-input"
              type="search"
              placeholder="Search owner, guesthouse or city"
              aria-label="Search requests"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {visible.length === 0 ? (
            <div className="w3r-state">
              {query ? (
                <>
                  <h2>No requests match your search</h2>
                  <p>Try a different name or clear the search box.</p>
                </>
              ) : filter === "pending" ? (
                <>
                  <h2>No pending requests</h2>
                  <p>New owner registrations appear here for review.</p>
                </>
              ) : (
                <>
                  <h2>No {filterLabel} requests</h2>
                  <p>Requests show here once they reach this stage.</p>
                </>
              )}
            </div>
          ) : (
            <div className="w3r-tablewrap">
              <table className="w3r-table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Guesthouse</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const isBusy = busy.has(r.id);
                    return (
                      <tr key={r.id}>
                        <td>
                          {r.ownerName}
                          <div className="w3r-sub">{r.email}</div>
                        </td>
                        <td>
                          {r.guesthouseName}
                          <div className="w3r-sub">{r.city}</div>
                        </td>
                        <td>{fmtDate(r.createdAt)}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td>
                          <div className="w3r-rowactions">
                            {r.status === "pending" && (
                              <>
                                <button
                                  className="w3r-btn w3r-btn--primary"
                                  disabled={isBusy}
                                  aria-label={`Approve ${r.guesthouseName}`}
                                  onClick={() => setDialog({ kind: "approve", request: r })}
                                >
                                  Approve
                                </button>
                                <button
                                  className="w3r-btn w3r-btn--danger"
                                  disabled={isBusy}
                                  aria-label={`Reject ${r.guesthouseName}`}
                                  onClick={() => setDialog({ kind: "reject", request: r })}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <Link className="w3r-btn" to={`/admin/requests/${r.id}`}>
                              Details
                            </Link>
                          </div>
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
        title={dialog?.kind === "reject" ? `Reject ${dialog.request.guesthouseName}?` : `Approve ${dialog?.request.guesthouseName ?? ""}?`}
        message={
          dialog?.kind === "reject"
            ? "This registration will be closed and the guesthouse will not be listed."
            : "The request moves to the approved queue. A rep can then be dispatched to collect on-site data."
        }
        confirmLabel={dialog?.kind === "reject" ? "Reject" : "Approve"}
        danger={dialog?.kind === "reject"}
        askReason={dialog?.kind === "reject"}
        onConfirm={onConfirm}
        onCancel={() => setDialog(null)}
      />
      <Toasts toasts={toasts} />
    </div>
  );
}