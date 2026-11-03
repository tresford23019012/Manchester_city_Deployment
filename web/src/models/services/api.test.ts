import { beforeEach, describe, expect, it, vi } from "vitest";
const token = vi.hoisted(()=>vi.fn(async()=>"firebase-id-token"));
vi.mock("../../auth/firebase",()=>({auth:{currentUser:{getIdToken:token}}}));
import { api, allPages } from "./api";
beforeEach(()=>{vi.restoreAllMocks();});
describe("authenticated API transport",()=>{
 it("sends a current Firebase token and PATCH JSON",async()=>{
  const fetcher=vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({blocked:true}),{status:200}));
  await api("/admin/users/user-1/block","PATCH",{blocked:true});
  expect(fetcher.mock.calls[0][0]).toBe("/api/v1/admin/users/user-1/block");
  expect(fetcher.mock.calls[0][1]).toMatchObject({method:"PATCH",headers:{Authorization:"Bearer firebase-id-token","Content-Type":"application/json"},body:'{"blocked":true}'});
 });
 it("loads every page and preserves filters",async()=>{
  const fetcher=vi.spyOn(globalThis,"fetch").mockResolvedValueOnce(new Response(JSON.stringify({content:[{id:1}],totalPages:2}))).mockResolvedValueOnce(new Response(JSON.stringify({content:[{id:2}],totalPages:2})));
  expect(await allPages("/admin/users?role=admin")).toEqual([{id:1},{id:2}]);
  expect(fetcher.mock.calls[1][0]).toBe("/api/v1/admin/users?role=admin&page=1&size=50");
 });
 it("surfaces backend validation details",async()=>{
  vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({message:"Validation failed",fieldErrors:{visitDate:"Visit date cannot be in the past"}}),{status:400}));
  await expect(api("/admin/requests/x/dispatch-rep","POST",{})).rejects.toThrow("Visit date cannot be in the past");
 });
 it("lets the browser set the multipart boundary",async()=>{
  const fetcher=vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response("{}"));
  const data=new FormData();data.append("files",new Blob(["photo"]),"photo.jpg");
  await api("/admin/guesthouses/x/photos","POST",data);
  expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty("Content-Type");
  expect(fetcher.mock.calls[0][1]?.body).toBe(data);
 });
 it("supports empty success responses",async()=>{
  vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(null,{status:204}));
  await expect(api("/admin/guesthouses/x","DELETE")).resolves.toBeUndefined();
 });
});
