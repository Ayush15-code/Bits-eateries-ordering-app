"use client";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCBhQKXyjaV0zLXxwRy1nQKbAkq62GmRA0",
  authDomain: "campus-eats-400e8.firebaseapp.com",
  projectId: "campus-eats-400e8",
  storageBucket: "campus-eats-400e8.firebasestorage.app",
  messagingSenderId: "158805004579",
  appId: "1:158805004579:web:fa564bd738b00264d2fc96"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);