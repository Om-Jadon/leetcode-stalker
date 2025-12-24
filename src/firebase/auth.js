import { auth, googleProvider, db } from "./config";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Save user's friend list to Firestore
export const saveUserList = async (userId, usernames) => {
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        leetcodeUsers: usernames,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving user list:", error);
    throw error;
  }
};

// Load user's friend list from Firestore
export const loadUserList = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().leetcodeUsers || [];
    }
    return [];
  } catch (error) {
    console.error("Error loading user list:", error);
    throw error;
  }
};
