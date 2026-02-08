import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Storage

const firebaseConfig = {
  apiKey: "AIzaSyCBhQKXyjaV0zLXxwRy1nQKbAkq62GmRA0",
  authDomain: "campus-eats-400e8.firebaseapp.com",
  projectId: "campus-eats-400e8",
  storageBucket: "campus-eats-400e8.firebasestorage.app",
  messagingSenderId: "158805004579",
  appId: "1:158805004579:web:fa564bd738b00264d2fc96"
};

// 1. Initialize Firebase App first
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize services using that app
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Storage properly here

// 3. Export everything at once
export { auth, db, storage };