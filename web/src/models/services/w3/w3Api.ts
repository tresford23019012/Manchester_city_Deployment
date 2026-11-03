import { api } from "../api";
import type { DashboardData } from "./types";
export async function getDashboard(): Promise<DashboardData> {
 const [stats, charts] = await Promise.all([
 api<{totalGuesthouses:number;cityWithMost:{city:string;count:number}|null;highestRated:{id:string;name:string;ratingAverage:number}|null}>("/admin/dashboard/stats"),
 api<{mostViewed:{name:string;views:number}[];mostFavourited:{name:string;favourites:number}[];listingStatus:DashboardData["statusBreakdown"]}>("/admin/dashboard/charts")]);
 return { stats: { totalGuesthouses:stats.totalGuesthouses, topCity:stats.cityWithMost ? {name:stats.cityWithMost.city,count:stats.cityWithMost.count} : null, highestRated:stats.highestRated ? {...stats.highestRated,city:"",rating:stats.highestRated.ratingAverage} : null },
 mostViewed:charts.mostViewed.map(item=>({name:item.name,views:item.views})), topFavourited:charts.mostFavourited, statusBreakdown:charts.listingStatus };
}
