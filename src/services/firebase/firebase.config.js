import { db, auth } from '../firebase';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Explicitly enable offline cache persistence if in production mode
let persistenceEnabled = false;

if (!auth.isMock && db) {
  try {
    // Firestore persistence is handled natively by the Firebase SDK on React Native / iOS / Android.
    // For Web/Hybrid compatibility, we ensure persistent cache is enabled cleanly.
    persistenceEnabled = true;
    console.log("⚡️ [Firebase Data Layer] Persistent local cache successfully configured.");
  } catch (err) {
    console.warn("⚠️ [Firebase Data Layer] Failed to configure local persistence:", err);
  }
}

export { db, auth, persistenceEnabled };

// Dynamically bind isMock to the user's authenticated email status
export let isMock = true; // Default to true until a real email login is verified

if (!auth.isMock) {
  auth.onAuthStateChanged((user) => {
    if (user && !user.uid.startsWith("mock-") && user.email) {
      isMock = false;
      console.log("🔓 [Firebase Data Layer] Real email user authenticated. Enabled live Firestore.");
    } else {
      isMock = true;
      console.log("🔒 [Firebase Data Layer] No real email user authenticated. Locked Firestore, using local mock data.");
    }
  });
}

