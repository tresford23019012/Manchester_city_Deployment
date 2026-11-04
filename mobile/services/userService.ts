import type { User } from 'firebase/auth';
import { API_BASE } from '../src/services/api';

export type AccountRole = 'customer' | 'owner';

// Set before Firebase account creation so the auth-state observer and the
// registration handler request the same role. Existing profiles keep their role.
let registrationRole: AccountRole = 'customer';
export function setRegistrationRole(role: AccountRole) { registrationRole = role; }
export function getRegistrationRole(): AccountRole { return registrationRole; }

export async function syncUserProfile(user: User, role: AccountRole = registrationRole) {
  const response = await fetch(`${API_BASE}/auth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ role }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not connect your account. Please try again.');
  return data as { role: string; id: string };
}
