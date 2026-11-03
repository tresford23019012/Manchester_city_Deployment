import { Alert } from "react-native";
import { router } from "expo-router";

export function requireAuth(isAuthenticated: boolean) {
  if (isAuthenticated) {
    return true;
  }

  Alert.alert(
    "Login required",
    "Please sign in to use this feature.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign in",
        onPress: () => router.push("/login"),
      },
    ]
  );

  return false;
}