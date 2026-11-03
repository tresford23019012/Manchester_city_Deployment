import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { usePathname, router } from "expo-router";
import { useEffect, useRef } from "react";

export default function Footer() {
  const pathname = usePathname();

  const exploreScale = useRef(new Animated.Value(0.8)).current;
  const mapScale = useRef(new Animated.Value(0.8)).current;
  const recentScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const icons = [
      { animation: exploreScale, active: pathname === "/" },
      { animation: mapScale, active: pathname === "/map" },
      {
        animation: recentScale,
        active: pathname === "/recent",
      },
    ];

    icons.forEach(({ animation, active }) => {
      Animated.spring(animation, {
        toValue: active ? 1.3 : 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }).start();
    });
  }, [pathname, exploreScale, mapScale, recentScale]);

    const exploreBar = useRef(new Animated.Value(0)).current;
    const mapBar = useRef(new Animated.Value(0)).current;
    const recentBar = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const bars = [
        { animation: exploreBar, active: pathname === "/" },
        { animation: mapBar, active: pathname === "/map" },
        {
          animation: recentBar,
          active: pathname === "/recent",
        },
      ];

      bars.forEach(({ animation, active }) => {
        animation.stopAnimation();

        Animated.timing(animation, {
          toValue: active ? 35 : 0,
          duration: 500,
          useNativeDriver: false,
        }).start();
      });
    }, [pathname, exploreBar, mapBar, recentBar]);

  return (
    <View style={styles.footerShadow}>
      <BlurView intensity={100} tint="light" blurMethod="dimezisBlurView" style={styles.footer}>
        <View style={styles.glassHighlight} pointerEvents="none" />
        <View style={styles.footerContent}>

          {/*Explore*/}
          <Pressable style={styles.menuButtons} onPress={() => router.push("/")}>
            <Animated.View
              style={{
                transform: [{ scale: exploreScale }],
              }} >

              <Ionicons
                name={pathname === "/" ? "compass" : "compass-outline"}
                size={28}
                color={pathname === "/" ? "#9B1C2B" : "#68736E"}
              />
            </Animated.View>

            <Text
              style={[styles.menuText, pathname === "/" && styles.activeText]}
            >
              Explore
            </Text>

            {pathname === "/"  &&  
            (<Animated.View
                  style={[
                    styles.activeBar,
                    { width: exploreBar },
                  ]}
                /> )}

          </Pressable>

          {/*Map*/}
          <Pressable style={styles.menuButtons} onPress={() => router.push("/map")}>
              <Animated.View
                style={{ transform: [{ scale: mapScale }] }}
              >
                <Ionicons
                  name={pathname === "/map" ? "location" : "location-outline"}
                  size={28}
                  color={pathname === "/map" ? "#9B1C2B" : "#68736E"}
                />
              </Animated.View>

            <Text
              style={[
                styles.menuText,
                pathname === "/map" && styles.activeText,
              ]}
            >
              Map
            </Text>

            {pathname === "/map"  && 
            (<Animated.View
                  style={[
                    styles.activeBar,
                    { width: mapBar },
                  ]}
                />) }

          </Pressable>

          {/*Recently Viewed*/}
          <Pressable style={styles.menuButtons} onPress={() => router.push("/recent")}>
            <Animated.View
              style={{ transform: [{ scale: recentScale }] }} >

            <Ionicons
              name={
                pathname === "/recent"
                  ? "time"
                  : "time-outline"
              }
              size={28}
              color={pathname === "/recent" ? "#9B1C2B" : "#68736E"}
            />
            </Animated.View>

            <Text
              style={[
                styles.menuText,
                pathname === "/recent" && styles.activeText,
              ]}
            >
              Recently Viewed
            </Text>

            {pathname === "/recent"  && 
            (<Animated.View
                  style={[
                    styles.activeBar,
                    { width: recentBar },
                  ]}
                /> ) }

          </Pressable>
          
        </View>
      </BlurView>
    </View>
  );
}


const styles = StyleSheet.create({
  footerShadow: {
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: "transparent",

    shadowColor: "#9B1C2B",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,

    elevation: 12,
  },

  footer: {
    height: 80,
    borderRadius: 30,
    overflow: "hidden",

    // Frosted glass with a subtle mint tint
    backgroundColor: "rgba(205, 235, 221, 0.55)",

    borderWidth: 1,
    borderColor: "rgba(205, 235, 221, 0.8)",
  },

  footerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 0,
  },

  glassHighlight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },

  menuButtons: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },

  menuText: {
    fontSize: 12,
    color: "#68736E",
    marginTop: 0,
    textAlign: "center",
  },

  activeText: {
    color: "#9B1C2B",
    fontWeight: "700",
  },

  activeBar: {
    position: "absolute",
    bottom: -8,
    width: 35,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9B1C2B",
    alignSelf: "center",
  },
});

