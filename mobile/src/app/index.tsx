import { router } from "expo-router";
import { Alert } from "react-native";
import { useFavourites } from "../context/FavouritesContext";

import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  FlatList, 
  Animated,
  ActivityIndicator,
} from "react-native";
import { getGuesthouses, type Guesthouse } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useScrollAnimation } from "../context/ScrollContext";
import { useAuth } from "../context/AuthContext";
import { requireAuth } from "../utils/requireAuth";

const COLORS = {
  primary: "#9B1C2B",
  mint: "#CDEBDD",
  darkCrimson: "#C8323B",

  background: "#F7FAF8",
  surface: "#FFFFFF",
  text: "#242424",
  secondaryText: "#68736E",
  placeholder: "#A0AAA5",
  border: "#E3EAE6",
};

const categories = ["Recommended", "Popular", "Affordable"] as const;
type Category = (typeof categories)[number];

type GuesthouseCard = {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string | null;
}

export default function Home() {

  const scrollY = useScrollAnimation();
  const [selectedCategory, setSelectedCategory] = useState<Category>("Recommended");
  const { favourites, toggle } = useFavourites();
  const favorites = favourites.map(g => g.id);
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const handleFavoritePress = (hotelId: string) => {
  if (!requireAuth(isAuthenticated)) return;

  toggleFavorite(hotelId);
};

  const loadGuesthouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getGuesthouses();
      setGuesthouses(result.content ?? []);
    } catch (err) {
      setError (
        err instanceof Error ? err.message : "Could not load guesthouses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGuesthouses();
  }, [loadGuesthouses]);

  const hotels: GuesthouseCard[] = guesthouses.map((guesthouse) => ({
    id: guesthouse.id,
    name: guesthouse.name,
    location: [guesthouse.address, guesthouse.city].filter(Boolean).join(", "),
    price: guesthouse.pricePerNight,
    rating: guesthouse.averageRating,
    reviews: guesthouse.ratingCount,
    image: guesthouse.images?.find((image) => Boolean(image?.trim())) ?? null,
  }))

  const filteredHotels = [...hotels];
   if (selectedCategory === "Affordable"){
    filteredHotels.sort((a, b) => a.price - b.price);
   } else if (selectedCategory === "Popular") {
    filteredHotels.sort((a, b) => b.rating - a.rating);
   }
      

  const toggleFavorite = (id: string) => { void toggle(id).catch(e => Alert.alert("Favourites", e.message)); };

  const renderImage = (
    image: string | null,
    imageStyle: object,
    placeholderStyles: object
  ) =>
    image ? (
      <Image source={{uri: image }} style={imageStyle} />
    ) : (
      <View style={[imageStyle, placeholderStyles, styles.imagePlaceholder]}>
        <Ionicons name="home-outline" size={32} color="#A99B8D" />
        <Text style={styles.placeholderText}>No image available</Text>
      </View>
    );

  const renderHotelCard = ({ item: hotel }: { item: GuesthouseCard }) => (
    <View style={styles.hotelCard}>
      <View>
       {renderImage(hotel.image, styles.hotelImage, styles.imagePlaceholder)}
       <Pressable
        style={styles.favoriteButton}
          onPress={() => handleFavoritePress(hotel.id)}
          accessibilityRole="button"
          accessibilityLabel={
            favorites.includes(hotel.id)
              ? `Remove ${hotel.name} from favorites`
              : `Add ${hotel.name} to favorites`
          }
          >
            <Ionicons
              name={favorites.includes(hotel.id) ? "heart" : "heart-outline"}
              size={22}
              color={favorites.includes(hotel.id) ? COLORS.darkCrimson : COLORS.secondaryText}
              />
          </Pressable>
      </View>

      <View style={styles.cardDetails}>
        <Text numberOfLines={1} style={styles.hotelName}>
          {hotel.name}
        </Text>

        <Text numberOfLines={1} style={styles.location}>
          <Ionicons name="location-outline" size={12} /> {hotel.location || hotel.name}
        </Text>

        <View style={styles.cardBottom}>
          <View style={styles.rating}>
            <Text style={styles.ratingText}> 
              ★ {Number.isFinite(hotel.rating) ? hotel.rating.toFixed(1) : "—"}
            </Text>
          </View>

          <Text style={styles.reviews}>{hotel.reviews} reviews</Text>
          <Text style={styles.price}>P{hotel.price}</Text>
        </View>

        <Pressable
          style={styles.detailsButton}
          onPress={() => {
            router.push({ pathname: "/guesthouse/[id]", params: { id: hotel.id } });
          }}
        >
          <Text style={styles.detailsText}>View details →</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStatus = () => {
    if (loading) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.statusText}>Loading guesthouses...</Text>
        </View>
      );
    }

    if (error) {
      return <View style={styles.statusContainer}><Text style={styles.statusText}>{error}</Text><Pressable onPress={loadGuesthouses}><Text>Try again</Text></Pressable></View>;
    }
    if (hotels.length === 0) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="bed-outline" size={30} color="#A99B8D" />
          <Text style={styles.statusText}>No guesthouses found.</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <Animated.ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[ styles.content, { paddingBottom: 160, paddingTop: 150 }]}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY }}}],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
          >
      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}
            >

            <Ionicons
              name={
               category === "Recommended"
                ? "home-outline"
                : category === "Popular"
                  ? "flame-outline"
                  : "diamond-outline"
              }
              size={18}
              color={selectedCategory === category ? "#FFFFFF" : "#54200F"} />
             {" "}
             {category} 
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Featured hotels */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === "Recommended"
            ? "Recommended for You"
            : selectedCategory === "Popular"
             ? "Top Rated Guesthouses"
              : "Affordable Guesthouses"}
        </Text>
      </View>

      {renderStatus()}

      {!loading && !error && hotels.length > 0 && (
      <FlatList
        data={filteredHotels}
        horizontal
        nestedScrollEnabled
        scrollEnabled={true}
        keyExtractor={(item) => item.id}
        renderItem={renderHotelCard}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hotelList}
      />
      )}

      {/* Nearby guest houses */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Guest Houses
        </Text>
        <Pressable onPress={loadGuesthouses}>
          <Text style={styles.seeAll}>Refresh ↻</Text>
        </Pressable>
      </View>

      {!loading && !error && (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.nearbyList}
      >
       {filteredHotels.map((hotel) => (
            <View key={hotel.id} style={styles.nearbyCard}>
              {renderImage(
                hotel.image,
                styles.nearbyImage,
                styles.nearbyImagePlaceholder      
            )}

            <Text numberOfLines={1} style={styles.nearbyName}>
              {hotel.name}
            </Text>
            <Text numberOfLines={1} style={styles.nearbyLocation}>
              {hotel.location || hotel.name}
            </Text>
            <Text style={styles.nearbyPrice}>P{hotel.price} / night</Text>
          </View>
        ))}
      </ScrollView>
      )}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  categoryList: {
    paddingHorizontal: 14,
    gap: 8,
    paddingBottom: 20,
  },
  categoryButton: {
    backgroundColor: COLORS.mint,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 22,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: "700",
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  hotelList: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  hotelCard: {
    width: 285,
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    marginRight: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  hotelImage: {
    width: "100%",
    height: 155,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F5F2",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  heart: {
    color: "#E74C3C",
    fontSize: 22,
  },
  cardDetails: {
    padding: 10,
  },
  hotelName: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  location: {
    color: COLORS.secondaryText,
    fontSize: 10,
    marginTop: 5,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
  },
  rating: {
    backgroundColor: COLORS.mint,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  ratingText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
  },
  reviews: {
    color: COLORS.secondaryText,
    fontSize: 10,
    flex: 1,
  },
  price: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  detailsButton: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginTop: 9,
  },
  detailsText: {
    color: COLORS.primary,
    fontSize: 10,
  },
  nearbyList: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },
  nearbyCard: {
    width: 145,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    paddingBottom: 9,
  },
  nearbyImage: {
    width: "100%",
    height: 100,
  },
  nearbyName: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    marginHorizontal: 8,
    marginTop: 7,
  },
  nearbyLocation: {
    color: COLORS.secondaryText,
    fontSize: 9,
    marginHorizontal: 8,
    marginTop: 3,
  },
  nearbyPrice: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "600",
    marginHorizontal: 8,
    marginTop: 5,
  },
  statusContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: COLORS.secondaryText,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  nearbyImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    color: "#62574F",
    fontSize: 10,
    marginTop: 5,
  },
});
