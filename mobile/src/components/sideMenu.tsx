import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { usePathname, router } from "expo-router";
import { View, Image, Text, Pressable, StyleSheet, Modal, } from "react-native";

import { logoutUser } from "../../services/authService";
import { Alert } from "react-native";



type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
};

export default function SideMenu({
  visible,
  onClose,
}: SideMenuProps) {

const pathname = usePathname();
const { user } = useAuth();

const handleLogout = () => {
  Alert.alert(
    "Log Out",
    "Are you sure you want to log out?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutUser();
            onClose();
            router.replace("/");
          } catch (error) {
            Alert.alert(
              "Logout Failed",
              "Unable to log out. Please try again."
            );
          }
        },
      },
    ]
  );
};

return (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      {/* Tap outside the menu to close it */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      />

      {/* Side menu panel */}
      <View style={styles.menuPanel}>
        <View style={styles.profileHeader}>
          <Pressable
            style={styles.profileRow}
            onPress={() => {
              onClose(); router.push("/login");
            }}
          >
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={30}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.displayName || "Guest"}</Text>
              <Text style={styles.profileSubtitle}>
                {user?.email || "Sign in to save favourites"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={23}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <View style={styles.homeButton}>
            <Pressable
                style={[styles.homeRow,
                       pathname === "/" && styles.activeMenuItem,]
                }
                onPress={() => { onClose(); router.push("/"); }}>              
       
             <View style={styles.menuIcon}>
                <Ionicons
                 name={pathname === "/" ? "home": "home-outline"}
                 size={34}
                 color={pathname === "/" ? "#FFFFFF" : "#68736E"}
                 
                 />
            </View>
               <Text style={[styles.homeName,
                pathname === "/" && styles.activeMenuText,]}>Home</Text>

                <Ionicons
                name="chevron-forward"
                size={23}
                color={pathname === "/" ? "#FFFFFF" : "#000000"}
                style={styles.homeArrow}
                />
            </Pressable>
        </View>

        <View style={styles.favouriteButton}>
            <Pressable
                style={[styles.homeRow,
                       pathname === "/favourite" && styles.activeMenuItem,]
                }
                onPress={() => { onClose(); router.push("/favourite"); }}>
                
       
             <View style={styles.menuIcon}>
                <Ionicons
                 name={pathname === "/favourite" ? "heart": "heart-outline"}
                 size={35}
                 color={pathname === "/favourite" ? "#FFFFFF" : "#000000"}
                 
                 />
            </View>
               <Text style={[styles.homeName,
                pathname === "/favourite" && styles.activeMenuText,]}>Favourites</Text>

                <Ionicons
                name="chevron-forward"
                size={23}
                color={pathname === "/favourite" ? "#FFFFFF" : "#000000"}
                style={styles.homeArrow}
                />
            </Pressable>
        </View>

        <View style={styles.favouriteButton}>
            <Pressable
                style={[styles.homeRow,
                       pathname === "/login" && styles.activeMenuItem,]
                }
                onPress={() => { onClose(); router.push("/login"); }}>
                
       
             <View style={styles.menuIcon}>
                <Ionicons
                 name={pathname === "/login" ? "exit": "exit-outline"}
                 size={35}
                 color={pathname === "/login" ? "#FFFFFF" : "#000000"}
                 
                 />
            </View>
               <Text style={[styles.homeName,
                pathname === "/login" && styles.activeMenuText,]}>Sign In</Text>

                <Ionicons
                name="chevron-forward"
                size={23}
                color={pathname === "/login" ? "#FFFFFF" : "#000000"}
                style={styles.homeArrow}
                />
            </Pressable>
        </View>

        <View style={styles.favouriteButton}>
            <Pressable
                style={styles.homeRow}
                onPress={handleLogout}>
                
             <View style={styles.menuIcon}>
                <Ionicons
                 name="log-out-outline"
                 size={35}
                 color="#C0392B"
                 
                 />
            </View>
               <Text style={[styles.homeName, { color: "#C0392B" }]}>Logout</Text>

                <Ionicons
                name="chevron-forward"
                size={23}
                color={pathname === "/logout" ? "#FFFFFF" : "#000000"}
                style={styles.homeArrow}
                />
            </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);
}



const styles = StyleSheet.create({
  menuIcon: { width: 36, alignItems: "center" },
  menuPanel: {
    width: "82%",
    maxWidth: 340,
    backgroundColor: "#F7FAF8",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  profileHeader: {
    backgroundColor: "#9B1C2B",
    paddingHorizontal: 18,
    paddingVertical: 28,
    borderTopRightRadius: 26,
    borderBottomRightRadius: 28,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#C8323B",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInfo: {
    flex: 1,
  },

  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  profileSubtitle: {
    color: "#F4D9DC",
    fontSize: 12,
    marginTop: 4,
  },

  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  backdrop: {
    flex: 1,
  },

  homeButton: {
    paddingVertical: 28,
    paddingHorizontal: 18,
  },

  favouriteButton: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },

  homeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 34,
    gap: 12,
    height: 65,
  },

  homeName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#242424",
  },

  homeArrow: {
    marginLeft: "auto",
  },

  activeMenuText: {
    color: "#FFFFFF",
  },

  activeMenuItem: {
    backgroundColor: "#9B1C2B",
  },
});
