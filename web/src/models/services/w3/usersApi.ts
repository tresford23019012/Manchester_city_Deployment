import { api, allPages } from "../api";
import type { AdminAccount, ManagedUser } from "./userTypes";
type User = AdminAccount & { role:string; blocked:boolean };
const managed = (u:User):ManagedUser => ({...u, role:u.role.toLowerCase() === "owner" ? "owner" : "guest",status:u.blocked ? "blocked" : "active",listingCount:null,paymentStatus:null,overdueDays:0,blockedAt:null,blockReason:null});
export async function listUsers() { return (await allPages<User>("/admin/users")).filter(u=>u.role.toLowerCase() !== "admin").map(managed); }
export async function blockUser(id:string, _reason?:string) { return managed(await api<User>(`/admin/users/${encodeURIComponent(id)}/block`,"PATCH",{blocked:true})); }
export async function unblockUser(id:string) { return managed(await api<User>(`/admin/users/${encodeURIComponent(id)}/block`,"PATCH",{blocked:false})); }
export async function listAdmins():Promise<AdminAccount[]> { return allPages<User>("/admin/users?role=admin"); }
export async function createAdmin(input:{email:string}):Promise<AdminAccount> { return api("/admin/admins","POST",{email:input.email}); }
