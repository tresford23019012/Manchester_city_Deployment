import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { getGuesthouses, request, Guesthouse } from '../services/api';
import { useAuth } from './AuthContext';
const Context = createContext<{ favourites: Guesthouse[]; error: string; toggle: (id:string) => Promise<void> } | null>(null);
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [favourites, setFavourites] = useState<Guesthouse[]>([]);
  const [error, setError] = useState('');
  const busy = useRef(new Set<string>());
  useEffect(() => {
    let active = true;
    setFavourites([]); setError('');
    if (isAuthenticated) getGuesthouses('/me/favourites', true).then(r => { if(active) setFavourites(r.content); }).catch(e => { if(active) setError(e.message); });
    return () => { active = false; };
  }, [user?.uid, isAuthenticated]);
  async function toggle(id:string) {
    if (!isAuthenticated) throw new Error('Please sign in first.');
    if (busy.current.has(id)) return;
    busy.current.add(id);
    try {
      await request(`/me/favourites/${encodeURIComponent(id)}`, { method: favourites.some(g => g.id === id) ? 'DELETE' : 'PUT' }, true);
      const result = await getGuesthouses('/me/favourites', true);
      setFavourites(result.content); setError('');
    } finally { busy.current.delete(id); }
  }
  return <Context.Provider value={{ favourites, error, toggle }}>{children}</Context.Provider>;
}
export function useFavourites() { const value = useContext(Context); if(!value) throw new Error('Missing favourites provider'); return value; }
