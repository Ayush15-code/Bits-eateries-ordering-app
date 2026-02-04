"use client";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "./firebase";

// Login function
export const loginMerchant = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Logout function
export const logoutUser = () => signOut(auth);

// Observer to check if user is logged in
export const monitorAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};