// Import necessary Firebase functions
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAomZhn4-Gu0SL0EcCqPy4eVA3dxpNC7k4",
  authDomain: "flappy-fric.firebaseapp.com",
  projectId: "flappy-fric",
  storageBucket: "flappy-fric.appspot.com",
  messagingSenderId: "524739228673",
  appId: "1:524739228673:web:086757f041220996987c00",
  measurementId: "G-W0C7PZ3N3Q"
};

// ✅ Prevent Firebase from initializing twice
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("✅ Firebase Initialized!", db); // Log Firestore instance

// Export Firestore so other scripts can use it
export { db };
