import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
export const configured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);
export const auth = configured ? getAuth(initializeApp({
 apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "locatebase-614b5.firebaseapp.com",
 projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "locatebase-614b5",
})) : null;
