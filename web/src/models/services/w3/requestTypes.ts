// Types for owner registration requests (tasks 82-83).
// Confirm these shapes with the backend owner before connecting the real API.

export type RequestStatus = "pending" | "approved" | "rejected" | "rep_dispatched" | "data_collected" | "published";

export type OwnerRequest = {
  id: string;
  ownerName: string;
  email: string;
  phone: string;
  guesthouseName: string;
  city: string;
  address: string;
  note: string; // free text from the owner. Render as plain text only.
  createdAt: string; // ISO date
  status: RequestStatus;
  approvedAt: string | null;
  rejectReason: string | null;
  rep: { name: string; dispatchedAt: string } | null;
  onSiteCollectedAt: string | null;
  publishedAt: string | null;
  guesthouseId: string | null; // set once published
};

export type ActionResult = { ok: true } | { ok: false; message: string };
