import type { RequestStatus } from "../../../models/services/w3/requestTypes";

const LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  rep_dispatched: "Rep dispatched",
  data_collected: "Data collected",
  published: "Published",
};

export default function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`w3r-badge w3r-badge--${status}`}>{LABELS[status]}</span>;
}
