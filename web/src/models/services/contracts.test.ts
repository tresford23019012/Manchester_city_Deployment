import { beforeEach, expect, it, vi } from "vitest";
vi.mock("./api",()=>({api:vi.fn(),allPages:vi.fn()}));
import { api } from "./api";
import { dispatchRep, markOnSiteCollected, mapRequest } from "./w3/requestsApi";
import { blockUser, unblockUser, createAdmin } from "./w3/usersApi";
import { getDashboard } from "./w3/w3Api";
import { guesthouseBody, mapGuesthouse } from "../../features/guesthouses/models/guesthouseStore";
const request={id:"r1",ownerName:"Owner",ownerEmail:"owner@example.com",phone:"1234567",guesthouseName:"Lodge",city:"Kasane",address:null,notes:null,createdAt:"2026-01-01",status:"rep_dispatched" as const,rejectReason:null,repName:"Rep",history:[{status:"approved",at:"2026-01-02"},{status:"rep_dispatched",at:"2026-01-03"}],pricePerNight:500,description:null};
beforeEach(()=>vi.resetAllMocks());
it("preserves request workflow stages and derives timestamps",()=>{
 expect(mapRequest(request)).toMatchObject({status:"rep_dispatched",email:"owner@example.com",approvedAt:"2026-01-02",rep:{name:"Rep",dispatchedAt:"2026-01-03"},onSiteCollectedAt:null});
});
it("dispatches with a visit date and uses the backend collection route",async()=>{
 vi.mocked(api).mockResolvedValue(request);
 await dispatchRep("r1","Rep","2026-12-01");
 expect(api).toHaveBeenLastCalledWith("/admin/requests/r1/dispatch-rep","POST",{repName:"Rep",visitDate:"2026-12-01"});
 await markOnSiteCollected("r1");expect(api).toHaveBeenLastCalledWith("/admin/requests/r1/mark-data-collected","POST",undefined);
});
it("blocks and unblocks with one PATCH endpoint; promotes by email only",async()=>{
 vi.mocked(api).mockResolvedValue({role:"owner",blocked:true});
 await blockUser("u1");expect(api).toHaveBeenLastCalledWith("/admin/users/u1/block","PATCH",{blocked:true});
 await unblockUser("u1");expect(api).toHaveBeenLastCalledWith("/admin/users/u1/block","PATCH",{blocked:false});
 await createAdmin({email:"staff@example.com"});expect(api).toHaveBeenLastCalledWith("/admin/admins","POST",{email:"staff@example.com"});
});
it("maps GeoJSON longitude first, nested contact and photos",()=>{
 const listing=mapGuesthouse({id:"g1",name:"Lodge",city:"Kasane",description:null,address:null,pricePerNight:500,status:"draft",ratingAverage:4.5,amenities:null,photos:[{publicId:"photo-1",url:"https://example.com/photo.jpg"}],contact:{phone:"123",email:"a@example.com",whatsapp:"456"},location:{coordinates:[25,-18]}});
 expect(listing).toMatchObject({longitude:25,latitude:-18,contactPhone:"123",images:["https://example.com/photo.jpg"],averageRating:4.5});
 expect(guesthouseBody({...listing,requestId:"r1"})).toMatchObject({location:{coordinates:[25,-18]},contact:{phone:"123",whatsapp:"456"},requestId:"r1"});
 expect(guesthouseBody(listing)).not.toHaveProperty("status");
 expect(guesthouseBody(listing)).not.toHaveProperty("photos");
});
it("combines the two dashboard endpoints without inventing time-series data",async()=>{
 vi.mocked(api).mockResolvedValueOnce({totalGuesthouses:2,cityWithMost:{city:"Kasane",count:2},highestRated:null}).mockResolvedValueOnce({mostViewed:[{name:"Lodge",views:7}],mostFavourited:[],listingStatus:{draft:1,published:1,suspended:0}});
 const result=await getDashboard();expect(result.stats.topCity).toEqual({name:"Kasane",count:2});expect(result.mostViewed).toEqual([{name:"Lodge",views:7}]);
 expect(api).toHaveBeenCalledWith("/admin/dashboard/stats");expect(api).toHaveBeenCalledWith("/admin/dashboard/charts");
});
