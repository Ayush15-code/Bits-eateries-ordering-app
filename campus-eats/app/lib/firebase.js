import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBhQKXyjaV0zLXxwRy1nQKbAkq62GmRA0",
  authDomain: "campus-eats-400e8.firebaseapp.com",
  projectId: "campus-eats-400e8",
  storageBucket: "campus-eats-400e8.firebasestorage.app",
  messagingSenderId: "158805004579",
  appId: "1:158805004579:web:fa564bd738b00264d2fc96"
};

// Initialize Firebase (Prevents "already exists" error)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// EXPORT THESE TWO:
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };