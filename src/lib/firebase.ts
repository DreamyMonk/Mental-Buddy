// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app"; // <<< Use named imports
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Basic validation
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn("Firebase config is missing or incomplete. Check your .env.local file.");
}

// Initialize Firebase only if it hasn't been initialized yet
// Use the named functions directly
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp(); // <<< Use named functions

const auth = getAuth(app);
const db = getFirestore(app);
// const storage = getStorage(app);

export { app, auth, db /*, storage */ };