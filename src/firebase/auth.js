// Authentication functions
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./config";

// Google provider for Google Sign-in
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const authService = {
  // Sign in with Google
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },
};

// Export individual functions for convenience
export const {
  signInWithGoogle,
  signOut: logout,
  onAuthStateChanged: onAuthChange,
  getCurrentUser,
} = authService;
