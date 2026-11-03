import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebase";
import { syncUserProfile } from '../../services/userService';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  syncError: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      setSyncError(null);
      try { if (currentUser) await syncUserProfile(currentUser); }
      catch (error) { if (active) setSyncError(error instanceof Error ? error.message : 'Account connection failed.'); }
      finally { if (active) setLoading(false); }
    });

    return () => { active = false; unsubscribe(); };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user && !loading && !syncError,
        syncError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
