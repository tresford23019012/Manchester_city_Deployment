import { auth } from "../../auth/firebase";
const base = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
 const user = auth?.currentUser;
 if (!user) throw new Error("Please sign in to continue.");
 const multipart = body instanceof FormData;
 const headers: Record<string,string> = { Authorization: `Bearer ${await user.getIdToken()}` };
 if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";
 let response: Response;
 try {
  response = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body), signal: AbortSignal.timeout(90000) });
 } catch { throw new Error("Could not reach the server. Check your connection and backend configuration, then retry."); }
 if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  const fields = error.fieldErrors ? Object.values(error.fieldErrors).join(" ") : "";
  throw new Error([error.message || `Request failed (${response.status})`, fields].filter(Boolean).join(" "));
 }
 if (response.status === 204) return undefined as T;
 return response.json();
}
export async function allPages<T>(path: string): Promise<T[]> {
 const items: T[] = [];
 for (let page = 0; ; page++) {
  const result = await api<{content:T[];totalPages:number}>(`${path}${path.includes("?") ? "&" : "?"}page=${page}&size=50`);
  items.push(...result.content);
  if (page + 1 >= result.totalPages) return items;
 }
}
