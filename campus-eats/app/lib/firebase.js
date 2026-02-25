import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Storage
import { enableIndexedDbPersistence } from "firebase/firestore";

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

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code == 'unimplemented') {
      console.log("The current browser does not support all of the features required to enable persistence");
    }
  });
}

// 3. Export everything at once
export { auth, db, storage };