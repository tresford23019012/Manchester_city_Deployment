package com.locatebase.api.dashboard;

import java.util.List;

public final class DashboardResponses {

    private DashboardResponses() {}

    public record CityCount(String city, long count) {}

    public record TopRated(String id, String name, double ratingAverage) {}

    public record Stats(long totalGuesthouses, CityCount cityWithMost, TopRated highestRated) {}

    public record GuesthouseViews(String id, String name, long views) {}

    public record GuesthouseFavourites(String id, String name, long favourites) {}

    public record StatusCounts(long draft, long published, long suspended) {}

    public record Charts(long totalViews, List<GuesthouseViews> mostViewed,
                         long totalFavourites, List<GuesthouseFavourites> mostFavourited,
                         StatusCounts listingStatus) {}

    public record Snapshot(Stats stats, Charts charts) {}
}
