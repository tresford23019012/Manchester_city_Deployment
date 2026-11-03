import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createAdmin, listAdmins } from "../../../models/services/w3/usersApi";
import type { AdminAccount } from "../../../models/services/w3/userTypes";
import "../Requests/requests.css";
export default function NewAdminPage() {
 const [email,setEmail]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const [admins,setAdmins]=useState<AdminAccount[]>([]);
 async function load() { try { setAdmins(await listAdmins()); } catch(e) { setError(e instanceof Error ? e.message : "Could not load administrators."); } }
 useEffect(()=>{void load();},[]);
 async function submit(e:FormEvent) {
  e.preventDefault();setBusy(true);setError("");setMessage("");
  try { const user=await createAdmin({email:email.trim()});setMessage(`${user.email} is now an administrator.`);setEmail("");await load(); }
  catch(e) {setError(e instanceof Error ? e.message : "Could not promote user.");} finally {setBusy(false);}
 }
 return <main className="w3r"><Link to="/admin/users">Back to users</Link><h1>Add administrator</h1>
 <p>The person must already have signed up and signed in to Locatebase. Enter their account email to grant administrator access.</p>
 <form onSubmit={submit} className="w3r-card"><label className="w3r-field">Account email<input className="w3r-input" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="w3r-btn" disabled={busy}>{busy ? "Saving…" : "Grant administrator access"}</button></form>
 {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
 <h2>Administrators</h2><ul>{admins.map(a=><li key={a.id}>{a.name} — {a.email}</li>)}</ul></main>;
}
