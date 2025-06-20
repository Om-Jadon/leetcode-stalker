// React context for authentication state management
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../firebase/auth";
import {
  userService,
  syncService,
  trackedUsersService,
} from "../firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Only authenticated Google users, never guests
  const [loading, setLoading] = useState(true);
  const [trackedUsers, setTrackedUsers] = useState([]);

  // Sync trackedUsers state with localStorage (used by both guests and authenticated users)
  useEffect(() => {
    const updateTrackedUsers = () => {
      const localTrackedUsers = JSON.parse(
        localStorage.getItem("leetcodeUsers") || "[]"
      );
      setTrackedUsers(localTrackedUsers);
    };

    // Initial load
    updateTrackedUsers();

    // Listen for storage changes
    window.addEventListener("storage", updateTrackedUsers);

    // Custom event for when we update localStorage from within the app
    window.addEventListener("trackedUsersChanged", updateTrackedUsers);

    return () => {
      window.removeEventListener("storage", updateTrackedUsers);
      window.removeEventListener("trackedUsersChanged", updateTrackedUsers);
    };
  }, []);

  // Simple data merge when user signs in with Google after being a guest
  const syncUserData = useCallback(async (userId) => {
    try {
      // Get local tracked users from guest usage
      const localTrackedUsers = JSON.parse(
        localStorage.getItem("leetcodeUsers") || "[]"
      );

      // Get existing cloud tracked users (if any)
      const userData = await userService.getUser(userId);
      const cloudTrackedUsers = userData?.trackedUsers || [];

      // Merge local and cloud tracked users (remove duplicates)
      const mergedTrackedUsers = [
        ...new Set([...localTrackedUsers, ...cloudTrackedUsers]),
      ];

      // Update localStorage with merged data
      localStorage.setItem("leetcodeUsers", JSON.stringify(mergedTrackedUsers));
      window.dispatchEvent(new CustomEvent("trackedUsersChanged"));

      // Update cloud with merged data
      if (mergedTrackedUsers.length > 0) {
        await syncService.syncLocalToCloud(userId, {
          trackedUsers: mergedTrackedUsers,
        });
      }
    } catch (error) {
      console.error("Error syncing user data:", error);
    }
  }, []);

  // Initialize auth on app start - only check for existing authenticated users
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Check if user is already signed in with Google
        const currentUser = authService.getCurrentUser();
        if (currentUser && !currentUser.isAnonymous) {
          // Only set authenticated users, sync their data
          await syncUserData(currentUser.uid);

          // Fetch user profile data from Firestore and merge with Firebase Auth user
          try {
            const userDoc = await userService.getUser(currentUser.uid);

            if (userDoc && userDoc.username && userDoc.leetcodeId) {
              // User has complete profile
              const enhancedUser = {
                ...currentUser,
                username: userDoc.username,
                leetcodeId: userDoc.leetcodeId,
              };
              setUser(enhancedUser);
            } else {
              // User only has Firebase auth, no profile yet
              setUser(currentUser);
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setUser(currentUser);
          }
        } else {
          // No authenticated user - user will be in guest mode
          setUser(null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [syncUserData]);

  // Listen to auth state changes for authenticated users only
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        // Only handle authenticated users, sync their data
        await syncUserData(firebaseUser.uid);

        // Fetch user profile data from Firestore and merge with Firebase Auth user
        try {
          const userDoc = await userService.getUser(firebaseUser.uid);

          if (userDoc && userDoc.username && userDoc.leetcodeId) {
            // User has complete profile
            const enhancedUser = {
              ...firebaseUser,
              username: userDoc.username,
              leetcodeId: userDoc.leetcodeId,
            };
            setUser(enhancedUser);
          } else {
            // User only has Firebase auth, no profile yet
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(firebaseUser);
        }
      } else {
        // No authenticated user
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [syncUserData]);

  // Sign in with Google - only creates Firebase auth user, doesn't create profile
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const firebaseUser = await authService.signInWithGoogle();

      // Sync data between localStorage and Firestore
      await syncUserData(firebaseUser.uid);

      // Set the Firebase user object in state (no profile data yet)
      setUser(firebaseUser);

      return firebaseUser;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setLoading(false);
      throw error;
    }
  };

  // Sign out (only for authenticated users)
  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Create complete user profile (after Google sign-in)
  const createUserProfile = async (username, leetcodeId) => {
    try {
      if (user) {
        // Check if username is already taken
        const isUsernameAvailable = await userService.checkUsernameAvailability(
          username.trim()
        );
        if (!isUsernameAvailable) {
          throw new Error(
            "Username is already taken. Please choose another one."
          );
        }

        // Create user document with profile data
        const userData = {
          username: username.trim(),
          email: user.email || "",
          leetcodeId: leetcodeId.trim(),
        };

        await userService.createUser(user.uid, userData);

        // Update the local user object with profile data
        const enhancedUser = {
          ...user,
          username: username.trim(),
          leetcodeId: leetcodeId.trim(),
        };

        setUser(enhancedUser);
        return enhancedUser;
      }
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  };

  // Update user's LeetCode ID (for authenticated users only)
  const updateLeetcodeId = async (leetcodeId) => {
    try {
      if (user) {
        await userService.updateUser(user.uid, { leetcodeId });
      }
    } catch (error) {
      console.error("Error updating LeetCode ID:", error);
      throw error;
    }
  };

  // Check if username is available (unique)
  const checkUsernameAvailability = async (username) => {
    try {
      // Query Firestore to check if username already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username.trim()));
      const querySnapshot = await getDocs(q);

      return querySnapshot.empty; // true if username is available
    } catch (error) {
      console.error("Error checking username availability:", error);
      throw error;
    }
  };

  // Get current tracked users list (LeetCode usernames being tracked)
  const getCurrentTrackedUsers = () => {
    return JSON.parse(localStorage.getItem("leetcodeUsers") || "[]");
  };

  // Add tracked user function (for LeetCode usernames)
  const addTrackedUser = async (username) => {
    try {
      const currentTrackedUsers = getCurrentTrackedUsers();
      if (!currentTrackedUsers.includes(username)) {
        const updatedTrackedUsers = [...currentTrackedUsers, username];
        localStorage.setItem(
          "leetcodeUsers",
          JSON.stringify(updatedTrackedUsers)
        );

        // Dispatch custom event to trigger state update
        window.dispatchEvent(new CustomEvent("trackedUsersChanged"));

        // If authenticated user, also sync to Firestore
        if (user) {
          await trackedUsersService.addTrackedUser(user.uid, username);
        }
      }
    } catch (error) {
      console.error("Error adding tracked user:", error);
      throw error;
    }
  };

  // Remove tracked user function (for LeetCode usernames)
  const removeTrackedUser = async (username) => {
    try {
      const currentTrackedUsers = getCurrentTrackedUsers();
      const updatedTrackedUsers = currentTrackedUsers.filter(
        (trackedUser) => trackedUser !== username
      );
      localStorage.setItem(
        "leetcodeUsers",
        JSON.stringify(updatedTrackedUsers)
      );

      // Dispatch custom event to trigger state update
      window.dispatchEvent(new CustomEvent("trackedUsersChanged"));

      // If authenticated user, also sync to Firestore
      if (user) {
        await trackedUsersService.removeTrackedUser(user.uid, username);
      }
    } catch (error) {
      console.error("Error removing tracked user:", error);
      throw error;
    }
  };

  const value = {
    user, // Only authenticated Google users, null for guests
    loading,
    trackedUsers, // LeetCode usernames being tracked (reactive state)
    isAuthenticated: !!user, // True only for authenticated Google users
    hasCompleteProfile: !!(user && user.username && user.leetcodeId), // True if user has profile setup
    isAnonymous: false, // Always false since we removed anonymous auth
    signInWithGoogle,
    signOut,
    updateLeetcodeId,
    createUserProfile,
    addFriend: addTrackedUser, // Keep old API for compatibility
    removeFriend: removeTrackedUser, // Keep old API for compatibility
    addTrackedUser,
    removeTrackedUser,
    getCurrentTrackedUsers,
    checkUsernameAvailability, // Expose the new function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
