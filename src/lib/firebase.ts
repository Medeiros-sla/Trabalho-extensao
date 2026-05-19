import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Using initializeFirestore with long polling as it's more stable in some proxy environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validation connection test
async function testConnection() {
  try {
    console.log("Testing Firestore connection...");
    const testDoc = await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firestore connection successful", testDoc.exists());
  } catch (error: any) {
    if (error?.code === 'permission-denied' || (error instanceof Error && error.message.includes("permission"))) {
      console.log("Firestore connection check: Reached server (Permission Denied is expected if public read is disabled)");
      return;
    }
    console.error("Firestore connection error:", error);
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Please check your Firebase configuration or project status.");
    }
  }
}

testConnection();

export { signInWithPopup, signOut, onAuthStateChanged };
