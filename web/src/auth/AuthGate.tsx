import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { api } from "../models/services/api";
export default function AuthGate({ children }: { children: ReactNode }) {
 const [ready,setReady] = useState(false), [allowed,setAllowed] = useState(false);
 const [email,setEmail] = useState(""), [password,setPassword] = useState("");
 const [error,setError] = useState(""), [busy,setBusy] = useState(false);
 useEffect(() => {
  if (!auth) { setReady(true); return; }
  let revision = 0;
  const unsubscribe = onAuthStateChanged(auth, async user => {
   const current = ++revision;
   setAllowed(false); setReady(false);
   try {
    if (user) {
     const profile = await api<{role:string}>("/auth/sync", "POST", {});
     // This protected read also rejects blocked admins.
     if (profile.role.toLowerCase() !== "admin") throw new Error("An administrator account is required.");
     await api("/admin/dashboard/stats");
     if (current === revision) { setAllowed(true); setError(""); }
    }
   } catch(e) { if (current === revision) setError(e instanceof Error ? e.message : "Sign-in failed."); }
   finally { if (current === revision) setReady(true); }
  });
  return () => { revision++; unsubscribe(); };
 }, []);
 async function login(e: FormEvent) {
  e.preventDefault(); if (!auth) return;
  setBusy(true); setError("");
  try { await signInWithEmailAndPassword(auth,email.trim(),password); setPassword(""); }
  catch { setError("Could not sign in. Check your email and password and try again."); }
  finally { setBusy(false); }
 }
 if (!ready) return <main className="login-card" role="status">Checking your session…</main>;
 if (allowed) return <><div className="session-bar"><span>Locatebase administration</span><button onClick={() => auth && signOut(auth).catch(() => setError("Could not sign out. Please retry."))}>Sign out</button>{error && <span role="alert">{error}</span>}</div>{children}</>;
 return <main className="login-card"><h1>Locatebase</h1><h2>Administrator sign-in</h2>
 {!auth ? <p role="alert">Firebase setup is missing. Copy .env.example to .env and add the Firebase web API key for locatebase-614b5, then restart the frontend.</p> : <form onSubmit={login}>
 <label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
 <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
 {auth.currentUser && <button type="button" onClick={()=>auth && signOut(auth)}>Use another account</button>}
 </form>}{error && <p role="alert">{error}</p>}</main>;
}
