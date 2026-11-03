// Types for user management (task 84) and admin-creates-admin (task 85).
// Confirm these shapes with the backend owner before connecting the real API.

export type UserRole = "guest" | "owner";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "blocked";
  listingCount: number | null; // owners only
  paymentStatus: "current" | "overdue" | null; // owners only
  overdueDays: number; // 0 unless overdue
  blockedAt: string | null;
  blockReason: string | null;
};

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type NewAdminInput = {
  name: string;
  email: string;
  password: string; // temporary password. Send over HTTPS only, never store or log it.
};
