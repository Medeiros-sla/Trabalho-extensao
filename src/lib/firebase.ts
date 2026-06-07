import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || "",
};

const app = initializeApp(firebaseConfig);

// Using initializeFirestore with long polling for maximum connection stability in sandbox proxy environments
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
