import { auth } from '../../config/firebase';

const origin = (process.env.EXPO_PUBLIC_API_URL || 'https://manchester-city-backend.onrender.com').replace(/\/$/, '');
export const API_BASE = origin.endsWith('/api/v1') ? origin : `${origin}/api/v1`;

export async function request<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (authenticated) {
    if (!auth.currentUser) throw new Error('Please sign in first.');
    headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
    const text = await response.text();
    let data: any;
    try { data = text ? JSON.parse(text) : undefined; } catch { data = undefined; }
    if (!response.ok) throw new Error(data?.message || `Request failed (${response.status}). Please try again.`);
    return data as T;
  } finally { clearTimeout(timeout); }
}

export type Guesthouse = {
  id: string; name: string; description: string; city: string; address: string;
  latitude: number | null; longitude: number | null; pricePerNight: number;
  amenities: string[]; images: string[]; contactPhone: string; contactEmail: string;
  averageRating: number; ratingCount: number;
};
type GuesthouseResponse = Omit<Guesthouse, 'latitude' | 'longitude' | 'images' | 'contactPhone' | 'contactEmail' | 'averageRating'> & {
  location?: { coordinates: number[] }; photos?: { url: string }[];
  contact?: { phone?: string; email?: string }; ratingAverage: number;
};
type Page<T> = { content: T[]; page: number; totalPages: number };
export function mapGuesthouse(g: GuesthouseResponse): Guesthouse {
  return { ...g, latitude: g.location?.coordinates?.[1] ?? null,
    longitude: g.location?.coordinates?.[0] ?? null,
    images: (g.photos || []).map(p => p.url).filter(Boolean),
    contactPhone: g.contact?.phone || '', contactEmail: g.contact?.email || '',
    averageRating: g.ratingAverage || 0, amenities: g.amenities || [] };
}
export async function getGuesthouses(path = '/guesthouses', authenticated = false) {
  const content: Guesthouse[] = [];
  let page = 0;
  let totalPages = 1;
  do {
    const result = await request<Page<GuesthouseResponse>>(`${path}?page=${page}&size=100`, {}, authenticated);
    content.push(...result.content.map(mapGuesthouse));
    totalPages = result.totalPages;
    page++;
  } while (page < totalPages);
  return { content };
}
export async function getGuesthouse(id: string) {
  return mapGuesthouse(await request<GuesthouseResponse>(`/guesthouses/${encodeURIComponent(id)}`));
}
