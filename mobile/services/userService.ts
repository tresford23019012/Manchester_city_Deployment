import type { User } from 'firebase/auth';
import { API_BASE } from '../src/services/api';

export async function syncUserProfile(user: User) {
  const response = await fetch(`${API_BASE}/auth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken(true)}` },
    body: JSON.stringify({ role: 'customer' }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not connect your account. Please try again.');
  return data;
}
