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
 if (!ready) return <main className="login-loading" role="status" aria-live="polite"><span className="login-loading__mark">◇</span><p>Checking your session…</p></main>;
 if (allowed) return <><div className="session-bar"><span>Locatebase administration</span><button onClick={() => auth && signOut(auth).catch(() => setError("Could not sign out. Please retry."))}>Sign out</button>{error && <span role="alert">{error}</span>}</div>{children}</>;
 return (
  <main className="login-shell">
   <section className="login-story" aria-label="LocateBase welcome">
    <div className="login-story__top"><span className="login-story__mark" aria-hidden="true">◇</span><span>LOCATEBASE</span></div>
    <div className="login-story__body">
     <span className="login-eyebrow">THE ADMINISTRATOR WORKSPACE</span>
     <h1>Every great stay starts with great management<span className="login-story__dot">.</span></h1>
     <p>One thoughtful space to manage your guesthouses, support owners and keep your listings moving forward.</p>
     <div className="login-story__feature"><span aria-hidden="true">✦</span><span>Organised listings. Clear decisions. Better experiences.</span></div>
    </div>
    <div className="login-story__bottom"><span>LOCATEBASE / ADMIN CONSOLE</span><span>CRIMSON × MINT MIST</span></div>
   </section>
   <section className="login-panel" aria-labelledby="login-heading">
    <div className="login-panel__inner">
     <div className="login-panel__brand"><span className="login-panel__brandmark" aria-hidden="true">◇</span> LocateBase <span className="login-panel__brandlabel">ADMIN</span></div>
     <div className="login-panel__intro"><span className="login-eyebrow">WELCOME BACK</span><h2 id="login-heading">Sign in to your workspace</h2><p>Enter your administrator credentials to continue.</p></div>
     {!auth ? <p className="login-alert" role="alert">Firebase setup is missing. Copy .env.example to .env and add the Firebase web API key for locatebase-614b5, then restart the frontend.</p> : (
      <form className="login-form" onSubmit={login}>
       <label htmlFor="admin-email">Email address<input id="admin-email" type="email" placeholder="you@example.com" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
       <label htmlFor="admin-password">Password<input id="admin-password" type="password" placeholder="Enter your password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
       <button className="login-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in to dashboard"}<span aria-hidden="true">→</span></button>
       {auth.currentUser && <button className="login-switch" type="button" onClick={()=>auth && signOut(auth)}>Use another account</button>}
      </form>
     )}
     {error && <p className="login-alert" role="alert">{error}</p>}
     <div className="login-panel__footer"><span aria-hidden="true">●</span> Secure administrator access</div>
    </div>
   </section>
  </main>
 );
}
