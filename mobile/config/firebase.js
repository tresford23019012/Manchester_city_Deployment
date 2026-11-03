import { initializeApp, getApp, getApps } from "firebase/app";

import {
    initializeAuth,
    getAuth,
    getReactNativePersistence
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "locatebase-614b5.firebaseapp.com",
    projectId: "locatebase-614b5",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialise Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialise Authentication with persistent storage
/** @type {import("firebase/auth").Auth} */
let auth;

try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (error) {
    // Reuse existing Auth instance during development reloads
    auth = getAuth(app);
}

export { app, auth };
