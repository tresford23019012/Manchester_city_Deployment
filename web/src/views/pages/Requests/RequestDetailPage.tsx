import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/Requests/ConfirmDialog";
import StatusBadge from "../../components/Requests/StatusBadge";
import { Toasts, useToasts } from "../../components/Requests/Toasts";
import {
  approveRequest,
  dispatchRep,
  markOnSiteCollected,
  rejectRequest,
} from "../../../models/services/w3/requestsApi";
import type { OwnerRequest } from "../../../models/services/w3/requestTypes";
import { fmtDate } from "../../../models/utils/Requests/format";
import { useRequest } from "../../../controllers/Requests/useRequest";
import "./requests.css";

type Step = { label: string; detail: string | null; state: "done" | "current" | "todo" | "stopped" };
type DialogKind = "approve" | "reject" | "publish" | null;

function buildSteps(r: OwnerRequest): Step[] {
  const received: Step = { label: "Request received", detail: fmtDate(r.createdAt), state: "done" };
  if (r.status === "rejected") {
    return [received, { label: "Rejected", detail: r.rejectReason ?? "No reason given", state: "stopped" }];
  }
  const stages = [
    { label: "Approved", detail: r.approvedAt ? fmtDate(r.approvedAt) : null, done: r.approvedAt !== null },
    { label: "Rep dispatched", detail: r.rep ? `${r.rep.name}, ${fmtDate(r.rep.dispatchedAt)}` : null, done: r.rep !== null },
    { label: "On-site data collected", detail: r.onSiteCollectedAt ? fmtDate(r.onSiteCollectedAt) : null, done: r.onSiteCollectedAt !== null },
    { label: "Published", detail: r.publishedAt ? fmtDate(r.publishedAt) : null, done: r.publishedAt !== null },
  ];
  let currentFound = false;
  const rest = stages.map((s): Step => {
    if (s.done) return { label: s.label, detail: s.detail, state: "done" };
    if (!currentFound) {
      currentFound = true;
      return { label: s.label, detail: s.detail, state: "current" };
    }
    return { label: s.label, detail: s.detail, state: "todo" };
  });
  return [received, ...rest];
}

const STATE_TEXT: Record<Step["state"], string> = {
  done: "Done",
  current: "Next",
  todo: "Upcoming",
  stopped: "Stopped",
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { request, loading, error, working, reload, run } = useRequest(id);
  const { toasts, push } = useToasts();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [rep, setRep] = useState("");
  const [visitDate, setVisitDate] = useState("");

  async function act(okText: string, failText: string, call: () => Promise<OwnerRequest>) {
    const result = await run(call);
    push(result.ok ? "success" : "error", result.ok ? okText : `${failText} ${result.message}`);
  }

  async function onConfirm(reason: string) {
    const kind = dialog;
    setDialog(null);
    if (!request || !kind) return;
    const name = request.guesthouseName;
    if (kind === "approve") await act(`Approved ${name}`, "Could not approve.", () => approveRequest(request.id));
    if (kind === "reject") await act(`Rejected ${name}`, "Could not reject.", () => rejectRequest(request.id, reason));

  }

  const back = (
    <Link className="w3r-backlink" to="/admin/requests">
      Back to requests
    </Link>
  );

  return (
    <div className="w3r">
      {back}

      {loading && !request && (
        <div role="status" aria-label="Loading request" className="w3r-card">
          <div className="w3r-skel" style={{ height: 28, width: "45%" }} />
          <div className="w3r-skel" style={{ height: 160, marginTop: 16 }} />
        </div>
      )}

      {error && !request && (
        <div className="w3r-state" role="alert">
          <h2>Request did not load</h2>
          <p>{error}</p>
          <button className="w3r-btn" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {request && (
        <>
          <header className="w3r-header">
            <div>
              <h1>{request.guesthouseName}</h1>
              <p className="w3r-sub">
                Requested by {request.ownerName} on {fmtDate(request.createdAt)}
              </p>
            </div>
            <StatusBadge status={request.status} />
          </header>

          <div className="w3r-detail">
            <div className="w3r-col">
              <section className="w3r-card" aria-labelledby="owner-h">
                <h2 id="owner-h">Owner</h2>
                <dl className="w3r-dl">
                  <dt>Name</dt>
                  <dd>{request.ownerName}</dd>
                  <dt>Email</dt>
                  <dd>
                    <a className="w3r-link" href={`mailto:${request.email}`}>
                      {request.email}
                    </a>
                  </dd>
                  <dt>Phone</dt>
                  <dd>{request.phone}</dd>
                </dl>
              </section>

              <section className="w3r-card" aria-labelledby="gh-h">
                <h2 id="gh-h">Guesthouse</h2>
                <dl className="w3r-dl">
                  <dt>Name</dt>
                  <dd>{request.guesthouseName}</dd>
                  <dt>City</dt>
                  <dd>{request.city}</dd>
                  <dt>Address</dt>
                  <dd>{request.address}</dd>
                  <dt>Note from owner</dt>
                  <dd>{request.note || "None"}</dd>
                </dl>
              </section>
            </div>

            <div className="w3r-col">
              <section className="w3r-card" aria-labelledby="progress-h">
                <h2 id="progress-h">Progress</h2>
                <ol className="w3r-steps">
                  {buildSteps(request).map((s, i) => (
                    <li key={s.label} className={`w3r-step w3r-step--${s.state}`} aria-current={s.state === "current" ? "step" : undefined}>
                      <span className="w3r-step__marker" aria-hidden="true">
                        {s.state === "done" ? "\u2713" : s.state === "stopped" ? "\u2715" : i + 1}
                      </span>
                      <div>
                        <div className="w3r-step__label">
                          {s.label} <span className="w3r-sr">({STATE_TEXT[s.state]})</span>
                        </div>
                        {s.detail && <div className="w3r-sub">{s.detail}</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="w3r-card" aria-labelledby="next-h">
                <h2 id="next-h">Next step</h2>

                {request.status === "pending" && (
                  <>
                    <p>Review the details, then approve or reject this registration.</p>
                    <div className="w3r-rowactions">
                      <button className="w3r-btn w3r-btn--primary" disabled={working} onClick={() => setDialog("approve")}>
                        Approve
                      </button>
                      <button className="w3r-btn w3r-btn--danger" disabled={working} onClick={() => setDialog("reject")}>
                        Reject
                      </button>
                    </div>
                  </>
                )}

                {request.status === "approved" && !request.rep && (
                  <>
                    <p>Send a rep to the guesthouse to collect on-site data.</p>
                    <label className="w3r-field">
                      <span>Rep to dispatch</span>
                      <input className="w3r-input" value={rep} maxLength={100} onChange={e=>setRep(e.target.value)} disabled={working}/>
                    </label>
                    <label className="w3r-field">Visit date<input className="w3r-input" type="date" value={visitDate} onChange={e=>setVisitDate(e.target.value)} disabled={working}/></label>
                    <button
                      className="w3r-btn w3r-btn--primary"
                      disabled={!rep.trim() || !visitDate || working}
                      onClick={() => act(`Rep dispatched: ${rep}`, "Could not dispatch the rep.", () => dispatchRep(request.id, rep.trim(), visitDate))}
                    >
                      Dispatch rep
                    </button>
                  </>
                )}

                {request.status === "rep_dispatched" && request.rep && (
                  <>
                    <p>
                      {request.rep.name} was dispatched on {fmtDate(request.rep.dispatchedAt)}. Mark the data as collected once the visit is done.
                    </p>
                    <button
                      className="w3r-btn w3r-btn--primary"
                      disabled={working}
                      onClick={() => act("On-site data marked as collected", "Could not update.", () => markOnSiteCollected(request.id))}
                    >
                      Mark on-site data collected
                    </button>
                  </>
                )}

                {request.status === "data_collected" && (
                  <>
                    <p>On-site data is collected. This guesthouse is ready to publish.</p>
                    <Link className="w3r-btn w3r-btn--primary" to={`/admin/guesthouses?requestId=${encodeURIComponent(request.id)}`}>Create linked listing</Link>
                  </>
                )}

                {request.status === "published" && (
                  <>
                    <p>This guesthouse is live{request.publishedAt ? ` since ${fmtDate(request.publishedAt)}` : ""}.</p>
                    {request.guesthouseId && (
                      <Link className="w3r-btn" to={`/admin/guesthouses?edit=${encodeURIComponent(request.guesthouseId)}`}>
                        View guesthouse
                      </Link>
                    )}
                  </>
                )}

                {request.status === "rejected" && (
                  <p>This request was rejected{request.rejectReason ? `: ${request.rejectReason}` : "."}</p>
                )}
              </section>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={dialog !== null}
        title={
          dialog === "reject"
            ? `Reject ${request?.guesthouseName ?? ""}?`
            : dialog === "publish"
              ? `Publish ${request?.guesthouseName ?? ""}?`
              : `Approve ${request?.guesthouseName ?? ""}?`
        }
        message={
          dialog === "reject"
            ? "This registration will be closed and the guesthouse will not be listed."
            : dialog === "publish"
              ? "The listing becomes visible to guests."
              : "The request moves to the approved queue. A rep can then be dispatched to collect on-site data."
        }
        confirmLabel={dialog === "reject" ? "Reject" : dialog === "publish" ? "Publish" : "Approve"}
        danger={dialog === "reject"}
        askReason={dialog === "reject"}
        onConfirm={onConfirm}
        onCancel={() => setDialog(null)}
      />
      <Toasts toasts={toasts} />
    </div>
  );
}