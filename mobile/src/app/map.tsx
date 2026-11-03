import { getGuesthouses } from "../services/api";
import { router } from "expo-router";
import React, { useRef, useState, useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  FlatList,
  Image,
  useWindowDimensions,
  ScrollView,
  Linking,
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INITIAL_REGION = {
  latitude: -22.5461,
  longitude: 27.1254,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type MapPlace = { id: string; name: string; location: string; price: number; rating: number; latitude: number; longitude: number; image?: string };

// Guesthouse card component
function GuesthouseCard({ place, onPress }: { place: MapPlace; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.hotelCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {place.image ? (
        <Image
          source={{ uri: place.image }}
          style={styles.hotelImage}
        />
      ) : (
        <View style={[styles.hotelImage, styles.imagePlaceholder]}>
          <Ionicons
            name="bed-outline"
            size={32}
            color="#9B1C2B"
          />
        </View>
      )}

      <View style={styles.hotelDetails}>
        <Text style={styles.hotelName} numberOfLines={1}>
          {place.name}
        </Text>

        <Text style={styles.hotelLocation}>
          {place.location}
        </Text>

        <Text style={styles.hotelRating}>
          ★ {place.rating || "New listing"}
        </Text>

        <Text style={styles.hotelPrice}>
          P{place.price}
          <Text style={styles.hotelNight}> / night</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => router.push({ pathname: "/guesthouse/[id]", params: { id: place.id } })}
      >
        <Ionicons
          name="information-circle-outline"
          size={22}
          color="#9B1C2B"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function MapScreen() {

  // Refs and screen dimensions
  const mapRef = useRef<MapView>(null);
  const [guesthouses, setGuesthouses] = useState<MapPlace[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; getGuesthouses().then(({ content }) => { if (active) setGuesthouses(content.filter(g => g.latitude !== null && g.longitude !== null).map(g => ({ id:g.id, name:g.name, location:g.city, price:g.pricePerNight, rating:g.averageRating, latitude:g.latitude!, longitude:g.longitude!, image:g.images[0] }))); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, []);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Bottom sheet dimensions
  const SHEET_HEIGHT = height * 0.78;
  const COLLAPSED_POSITION = SHEET_HEIGHT - 190;

  // States
  const [selected, setSelected] = useState<MapPlace | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Animation values
  const sheetPosition = useRef(
    new Animated.Value(COLLAPSED_POSITION)
  ).current;

  const expandedRef = useRef(false);
  const dragStart = useRef(COLLAPSED_POSITION);

  // Open or close bottom sheet
  const snapSheet = (expand: boolean) => {
    expandedRef.current = expand;
    setExpanded(expand);

    Animated.spring(sheetPosition, {
      toValue: expand ? 0 : COLLAPSED_POSITION,
      useNativeDriver: true,
      friction: 9,
      tension: 65,
    }).start();
  };

  // Select sheet position
  const changeSheet = (expand: boolean) => {
    snapSheet(expand);
  };

  // Drag gestures
const panResponder = useRef(
  PanResponder.create({

  onStartShouldSetPanResponder: () => false,

  onMoveShouldSetPanResponder: (_, gesture) =>
    Math.abs(gesture.dy) > 5 &&
    Math.abs(gesture.dy) > Math.abs(gesture.dx),

    onPanResponderTerminationRequest: () => false,

    onPanResponderGrant: () => {
      console.log("DRAG STARTED");

      // Use the known resting position
      dragStart.current = expandedRef.current
        ? 0
        : COLLAPSED_POSITION;

      // Stop any ongoing animation before dragging
      sheetPosition.stopAnimation();
    },

    onPanResponderMove: (_, gesture) => {

      const nextPosition = Math.max(
        0,
        Math.min(
          COLLAPSED_POSITION,
          dragStart.current + gesture.dy
        )
      );

      sheetPosition.setValue(nextPosition);

      console.log("DRAGGING:", gesture.dy);
    },

    onPanResponderRelease: (_, gesture) => {

      console.log("DRAG RELEASED:", gesture.dy);

      const currentPosition =
        dragStart.current + gesture.dy;

      const midpoint = COLLAPSED_POSITION / 2;

      if (gesture.dy < -40 || gesture.vy < -0.5) {
        snapSheet(true);
      } 
      else if (gesture.dy > 40 || gesture.vy > 0.5) {
        snapSheet(false);
      } 
      else {
        snapSheet(currentPosition < midpoint);
      }
    },

  })
).current;

  // Focus on selected guesthouse
  function focusGuesthouse(place: MapPlace) {
    setSelected(place);

    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      500
    );
  }

  // Reset map
  function resetMap() {
    setSelected(null);

    mapRef.current?.animateToRegion(
      INITIAL_REGION,
      500
    );
  }

  if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) return <ScrollView contentContainerStyle={{ padding:24, paddingTop:150, paddingBottom:160, gap:16 }}><Text style={{fontSize:26,fontWeight:"700",color:"#9B1C2B"}}>Guesthouse locations</Text><Text>Select a guesthouse to open its location in Maps.</Text>{error ? <Text>{error}</Text> : null}{guesthouses.map(place => <TouchableOpacity key={place.id} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`)} style={{padding:20,backgroundColor:"white",borderRadius:16}}><Text style={{fontWeight:"700"}}>{place.name}</Text><Text>{place.location} · P{place.price} / night</Text><Text>Open map →</Text></TouchableOpacity>)}</ScrollView>;

  return (
    <View style={styles.container}>

      {/* Google Map */}
      <MapView
        ref={mapRef}
        style={[styles.map, { marginTop: 100 }]}
        initialRegion={INITIAL_REGION}
        onPress={() => setSelected(null)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onMapReady={() =>
          console.log("LocateBase map ready")
        }
      >
        {guesthouses.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() => focusGuesthouse(place)}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.priceMarker,
                selected?.id === place.id &&
                  styles.activeMarker,
              ]}
            >
              <Text
                style={[
                  styles.priceText,
                  selected?.id === place.id &&
                    styles.activePriceText
                ]}
              >
                P{place.price}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Draggable guesthouse panel */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: SHEET_HEIGHT,
            bottom: insets.bottom + -20,
            transform: [
              { translateY: sheetPosition },
            ],
          },
        ]}
      >

      {/* Draggable header area */}
        <View {...panResponder.panHandlers}>

        <View style={styles.dragArea}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {error || "Available guesthouses"}
          </Text>

          <TouchableOpacity onPress={() => changeSheet(true)}>
            <Text style={styles.seeAll}>
              See all →
            </Text>
          </TouchableOpacity>
        </View>

      </View>

        {/* Guesthouse list */}
        <FlatList
          data={guesthouses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GuesthouseCard
              place={item}
              onPress={() => focusGuesthouse(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 20,
          }}
          nestedScrollEnabled
        />

      </Animated.View>

      {/* Recenter button */}
      <TouchableOpacity
        style={[
          styles.locationButton,
          { bottom: insets.bottom + 100 },
        ]}
        onPress={resetMap}
        accessibilityLabel="Reset map view"
      >
        <Ionicons
          name="locate-outline"
          size={25}
          color="#9B1C2B"
        />
      </TouchableOpacity>

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF8",
  },

  map: {
    flex: 1,
    width: "100%",
  },

  // Map markers
  priceMarker: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#9B1C2B",
    elevation: 4,
  },

  activeMarker: {
    backgroundColor: "#9B1C2B",
    borderColor: "#FFFFFF",
  },

  priceText: {
    color: "#9B1C2B",
    fontWeight: "700",
    fontSize: 13,
  },

  activePriceText: {
    color: "#FFFFFF",
  },

  // Bottom sheet
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#F7FAF8",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 14,
    elevation: 15,
    zIndex: 10,
  },

  dragArea: {
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 10,
    backgroundColor: "#B8C9C0",
  },

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },

  sheetTitle: {
    color: "#242424",
    fontSize: 16,
    fontWeight: "700",
  },

  seeAll: {
    color: "#9B1C2B",
    fontWeight: "600",
    fontSize: 13,
  },

  // Guesthouse cards
  hotelCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    marginBottom: 10,
    padding: 7,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E3EAE6",
  },

  hotelImage: {
    width: 115,
    height: 112,
    borderRadius: 9,
  },

  imagePlaceholder: {
    backgroundColor: "#CDEBDD",
    alignItems: "center",
    justifyContent: "center",
  },

  hotelDetails: {
    flex: 1,
    paddingTop: 8,
  },

  hotelName: {
    color: "#242424",
    fontSize: 14,
    fontWeight: "600",
  },

  hotelLocation: {
    color: "#68736E",
    fontSize: 12,
    marginTop: 4,
  },

  hotelRating: {
    color: "#68736E",
    fontSize: 12,
    marginTop: 5,
  },

  hotelPrice: {
    color: "#9B1C2B",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },

  hotelNight: {
    color: "#68736E",
    fontSize: 11,
    fontWeight: "400",
  },

  favoriteButton: {
    padding: 7,
  },

  // Location button
  locationButton: {
    position: "absolute",
    right: 16,
    backgroundColor: "#FFFFFF",
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    zIndex: 5,
    borderWidth: 1,
    borderColor: "#CDEBDD",
  },
});

