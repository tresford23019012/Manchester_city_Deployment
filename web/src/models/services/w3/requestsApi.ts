import { api, allPages } from "../api";
import type { OwnerRequest, RequestStatus } from "./requestTypes";
export type RequestDto = {id:string;ownerName:string;ownerEmail:string;phone:string;guesthouseName:string;city:string;address:string|null;notes:string|null;createdAt:string;status:RequestStatus;rejectReason:string|null;repName:string|null;history:{status:string;at:string}[];pricePerNight:number;description:string|null};
export function mapRequest(r:RequestDto):OwnerRequest {
 const at=(status:string)=>r.history.find(h=>h.status===status)?.at ?? null;
 return {...r,email:r.ownerEmail,address:r.address||"",note:r.notes||"",approvedAt:at("approved"),rep:r.repName ? {name:r.repName,dispatchedAt:at("rep_dispatched")||r.createdAt} : null,onSiteCollectedAt:at("data_collected"),publishedAt:at("published"),guesthouseId:null};
}
export async function listRequests() { return (await allPages<RequestDto>("/admin/requests")).map(mapRequest); }
export async function getRequest(id:string) { return mapRequest(await api<RequestDto>(`/admin/requests/${encodeURIComponent(id)}`)); }
async function action(id:string,name:string,body?:unknown) { return mapRequest(await api<RequestDto>(`/admin/requests/${encodeURIComponent(id)}/${name}`,"POST",body)); }
export const approveRequest=(id:string)=>action(id,"approve");
export const rejectRequest=(id:string,reason:string)=>action(id,"reject",{reason});
export const dispatchRep=(id:string,repName:string,visitDate:string)=>action(id,"dispatch-rep",{repName,visitDate});
export const markOnSiteCollected=(id:string)=>action(id,"mark-data-collected");
