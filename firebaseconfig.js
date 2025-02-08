import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

async function getFirebaseConfig() {
    const response = await fetch("firebaseconfig.json");
    return await response.json();
}

let db;
getFirebaseConfig().then((config) => {
    const app = getApps().length ? getApp() : initializeApp(config);
    db = getFirestore(app);
    console.log("✅ Firebase Initialized!", db);
});

export { db };
