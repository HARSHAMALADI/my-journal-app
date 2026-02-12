import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar.events.readonly");

// --- Auth Functions ---

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Capture Google OAuth access token for Calendar API
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      localStorage.setItem("google_calendar_token", credential.accessToken);
    }
    return result.user;
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "auth/popup-closed-by-user") return null;
    console.error("Google sign-in error:", error);
    return null;
  }
}

export function getGoogleCalendarToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("google_calendar_token");
}

export function clearGoogleCalendarToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("google_calendar_token");
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// --- Data Functions (uses auth uid) ---

function getUserId(): string {
  if (typeof window === "undefined") return "server";
  // Use Firebase Auth uid if logged in
  if (auth.currentUser) return auth.currentUser.uid;
  // Fallback to localStorage anonymous id
  let uid = localStorage.getItem("diary-uid");
  if (!uid) {
    uid = "anon-" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem("diary-uid", uid);
  }
  return uid;
}

export async function saveData<T>(collection: string, key: string, data: T): Promise<void> {
  const uid = getUserId();
  try {
    await setDoc(doc(db, collection, `${uid}_${key}`), {
      uid,
      key,
      data: JSON.stringify(data),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Fallback to localStorage
    localStorage.setItem(`${collection}-${key}`, JSON.stringify(data));
  }
}

export async function loadData<T>(collection: string, key: string, fallback: T): Promise<T> {
  const uid = getUserId();
  try {
    const snap = await getDoc(doc(db, collection, `${uid}_${key}`));
    if (snap.exists()) {
      return JSON.parse(snap.data().data) as T;
    }
  } catch {
    // Fallback to localStorage
    try {
      const local = localStorage.getItem(`${collection}-${key}`);
      if (local) return JSON.parse(local) as T;
    } catch { /* empty */ }
  }
  return fallback;
}

export { db, auth };
export type { User };
