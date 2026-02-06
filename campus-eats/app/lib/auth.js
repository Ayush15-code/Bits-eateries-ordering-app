"use client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export const loginUser = async (email, password, isMerchantMode) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (isMerchantMode) {
      // 1. Verify if user exists in 'merchants' collection
      const merchantDoc = await getDoc(doc(db, "merchants", user.uid));
      if (!merchantDoc.exists()) {
        throw new Error("Access Denied: You are not registered as a Merchant.");
      }
      return { user, role: 'merchant' };
    } else {
      // 2. Optional: Verify if user is a student (e.g., check BITS email domain)
      if (!user.email.endsWith("@goa.bits-pilani.ac.in")) {
        // You can either throw an error or just tag them as a guest
        console.warn("Non-BITS email detected");
      }
      
      // If you have a 'students' collection, check it here similarly to merchants
      const studentDoc = await getDoc(doc(db, "students", user.uid));
      if (!studentDoc.exists()) {
         // If they don't exist yet, you might want to create a profile for them
         console.log("New student detected");
      }
      
      return { user, role: 'student' };
    }
  } catch (error) {
    throw error;
  }
};