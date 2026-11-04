import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import { auth } from "../config/firebase";
import { syncUserProfile, setRegistrationRole } from './userService';

// Register a new user
export async function registerUser({
  firstName,
  lastName,
  email,
  password,
  role = 'customer',
}) {
  setRegistrationRole(role);
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Save the user's name to their Firebase profile
    await updateProfile(userCredential.user, {
      displayName: fullName,
    });

    await syncUserProfile(userCredential.user, role);
    return userCredential.user;
  } catch (error) {
    throw error;
  } finally {
    setRegistrationRole('customer');
  }
}

// Login an existing user
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  await syncUserProfile(userCredential.user);
  return userCredential.user;
}

// Logout the current user
export async function logoutUser() {
  await signOut(auth);
}

// Send password reset email
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}
