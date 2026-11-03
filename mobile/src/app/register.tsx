import { registerUser } from "../../services/authService";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleRegister = async () => {
  if (
    !email.trim() ||
    !firstName.trim() ||
    !lastName.trim() ||
    !password ||
    !confirmPassword
  ) {
    Alert.alert("Missing information", "Please complete all fields.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Password mismatch", "Your passwords do not match.");
    return;
  }

  if (password.length < 6) {
    Alert.alert(
      "Weak password",
      "Your password must contain at least 6 characters."
    );
    return;
  }

  try {
    setLoading(true);

    const user = await registerUser({
      firstName,
      lastName,
      email,
      password,
    });


    Alert.alert(
      "Welcome to Locatebase!",
      "Your account has been created successfully.",
      [
        {
          text: "Continue",
          onPress: () => router.replace("/"),
        },
      ]
    );

} catch (error: any) {
  console.log("REGISTRATION ERROR:", error);
  console.log("ERROR CODE:", error.code);
  console.log("ERROR MESSAGE:", error.message);
  console.log("REGISTRATION ERROR:", error);

  Alert.alert(
    "Registration failed",
    `${error.code || "Unknown error"}\n${error.message || "No error details"}`
  );
}finally {
    setLoading(false);
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>⌖</Text>
            </View>
            <Text style={styles.logoText}>LOCATEBASE</Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Get Started</Text>
          <Text style={styles.subtitle}>
            Create your account and discover amazing places to stay.
          </Text>

          {/* Registration fields */}
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Register button */}
            <Pressable
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={loading}
            >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.primaryButtonText}>
                Create Account
                </Text>
            )}
            </Pressable>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          {/* Social registration */}
          <View style={styles.socialContainer}>
            <Pressable
              style={styles.socialButton}
              onPress={() =>
                Alert.alert("Coming soon", "Google sign-in will be connected next.")
              }
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialText}>Google</Text>
            </Pressable>

            <Pressable
              style={styles.socialButton}
              onPress={() =>
                Alert.alert("Coming soon", "Facebook sign-in will be connected next.")
              }
            >
              <Text style={styles.facebookIcon}>f</Text>
              <Text style={styles.socialText}>Facebook</Text>
            </Pressable>
          </View>

          {/* Login link */}
          <View style={styles.bottomTextContainer}>
            <Text style={styles.bottomText}>
              Already have an account?{" "}
            </Text>

            <Pressable onPress={() => router.replace("/login")}>
              <Text style={styles.linkText}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAF8",
  },

  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingVertical: 25,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 22,
  },

  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#CDEBDD",
    justifyContent: "center",
    alignItems: "center",
  },

  logoIcon: {
    fontSize: 36,
    color: "#9B1C2B",
  },

  logoText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#9B1C2B",
  },

  heading: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    color: "#242424",
  },

  subtitle: {
    fontSize: 11,
    color: "#68736E",
    textAlign: "center",
    marginTop: 7,
    marginBottom: 23,
  },

  input: {
    height: 45,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CDEBDD",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 11,
    fontSize: 12,
    color: "#242424",
  },

  primaryButton: {
    height: 47,
    borderRadius: 12,
    backgroundColor: "#9B1C2B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#DCE8E1",
  },

  orText: {
    marginHorizontal: 13,
    fontSize: 10,
    color: "#68736E",
  },

  socialContainer: {
    flexDirection: "row",
    gap: 12,
  },

  socialButton: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CDEBDD",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  googleIcon: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4285F4",
  },

  facebookIcon: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1877F2",
  },

  socialText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#242424",
  },

  bottomTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },

  bottomText: {
    fontSize: 10,
    color: "#68736E",
  },

  linkText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9B1C2B",
  },
});

