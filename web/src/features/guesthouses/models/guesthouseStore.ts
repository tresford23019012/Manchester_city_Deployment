import { api, allPages } from "../../../models/services/api";
import type { Guesthouse, GuesthouseStatus } from "../views/GuesthouseForm";
export type Listing = Guesthouse & { photos?: {publicId:string;url:string}[] };
export const PAGE_SIZE = 5;
export const statuses:GuesthouseStatus[] = ["published","draft","suspended"];
export type GuesthouseDto = {id:string;name:string;city:string;description:string|null;address:string|null;pricePerNight:number;status:GuesthouseStatus;ratingAverage:number;amenities:string[]|null;photos:{publicId:string;url:string}[]|null;contact:{phone?:string;email?:string;whatsapp?:string}|null;location:{coordinates:number[]}|null};
export function mapGuesthouse(g:GuesthouseDto):Listing { return {...g,description:g.description||"",address:g.address||"",contactPhone:g.contact?.phone||"",contactEmail:g.contact?.email||"",contactWhatsapp:g.contact?.whatsapp||"",images:(g.photos||[]).map(p=>p.url),photos:g.photos||[],amenities:g.amenities||[],longitude:g.location?.coordinates[0],latitude:g.location?.coordinates[1],averageRating:g.ratingAverage}; }
export async function loadGuesthouses() { return (await allPages<GuesthouseDto>("/admin/guesthouses")).map(mapGuesthouse); }
export function guesthouseBody(g:Guesthouse) { return {name:g.name,city:g.city,description:g.description,address:g.address,pricePerNight:g.pricePerNight,amenities:g.amenities||[],location:{coordinates:[g.longitude,g.latitude]},contact:{phone:g.contactPhone,email:g.contactEmail,whatsapp:g.contactWhatsapp},requestId:g.requestId}; }
export async function saveDetails(g:Guesthouse, existing:boolean) { return mapGuesthouse(await api<GuesthouseDto>(`/admin/guesthouses${existing ? `/${encodeURIComponent(g.id)}` : ""}`,existing ? "PUT":"POST",guesthouseBody(g))); }
export async function setStatus(id:string,status:GuesthouseStatus) { return mapGuesthouse(await api<GuesthouseDto>(`/admin/guesthouses/${encodeURIComponent(id)}/status`,"PATCH",{status})); }
export async function uploadPhoto(id:string,file:File) { const body=new FormData();body.append("files",file);return mapGuesthouse(await api<GuesthouseDto>(`/admin/guesthouses/${encodeURIComponent(id)}/photos`,"POST",body)); }
export async function removePhoto(id:string,publicId:string) { return mapGuesthouse(await api<GuesthouseDto>(`/admin/guesthouses/${encodeURIComponent(id)}/photos/${encodeURIComponent(publicId)}`,"DELETE")); }
