// View models adapted from the backend dashboard responses.

export type DashboardStats = {
  totalGuesthouses: number;
  topCity: { name: string; count: number } | null;
  highestRated: { id: string; name: string; city: string; rating: number } | null;
};

export type ViewedGuesthouse = { name: string; views: number };
export type FavouritesItem = { name: string; favourites: number };
export type StatusBreakdown = { published: number; draft: number; suspended: number };

export type DashboardData = {
  stats: DashboardStats;
  mostViewed: ViewedGuesthouse[];
  topFavourited: FavouritesItem[];
  statusBreakdown: StatusBreakdown;
};