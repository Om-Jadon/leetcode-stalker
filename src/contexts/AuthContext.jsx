// React context for authentication state management
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  authService,
  userService,
  syncService,
  trackedUsersService,
} from "../firebase";

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
      // Get local data from guest usage
      const localTrackedUsers = JSON.parse(
        localStorage.getItem("leetcodeUsers") || "[]"
      );
      const localLeetCodeId = localStorage.getItem("userLeetcodeId") || "";

      // Get existing cloud data (if any)
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

      // Sync LeetCode ID
      if (localLeetCodeId && !userData?.leetcodeId) {
        await userService.updateUser(userId, { leetcodeId: localLeetCodeId });
      } else if (userData?.leetcodeId && !localLeetCodeId) {
        localStorage.setItem("userLeetcodeId", userData.leetcodeId);
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
            const enhancedUser = {
              ...currentUser,
              username: userDoc?.username || "",
              leetcodeId: userDoc?.leetcodeId || "",
            };
            setUser(enhancedUser);
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
          const enhancedUser = {
            ...firebaseUser,
            username: userDoc?.username || "",
            leetcodeId: userDoc?.leetcodeId || "",
          };
          setUser(enhancedUser);
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

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const firebaseUser = await authService.signInWithGoogle();

      // Check if user document already exists
      let userDoc = await userService.getUser(firebaseUser.uid);

      if (!userDoc) {
        // Only create a new user document if one doesn't exist
        const userData = {
          username: firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          leetcodeId: "", // Will be set later by user
        };

        await userService.createUser(firebaseUser.uid, userData);
        userDoc = await userService.getUser(firebaseUser.uid);
      } else {
        // User exists, just update last login
        await userService.updateUser(firebaseUser.uid, {
          lastLogin: new Date().toISOString(),
        });
      }

      const hasCompleteProfile =
        userDoc && userDoc.username && userDoc.leetcodeId;

      // Sync data between localStorage and Firestore
      await syncUserData(firebaseUser.uid);

      // Create enhanced user object with profile data
      const enhancedUser = {
        ...firebaseUser,
        username: userDoc?.username || "",
        leetcodeId: userDoc?.leetcodeId || "",
      };

      // Set the enhanced user object in state
      setUser(enhancedUser);

      return {
        ...enhancedUser,
        hasCompleteProfile,
      };
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

  // Create complete user profile (for new authenticated users)
  const createUserProfile = async (username, leetcodeId) => {
    try {
      if (user) {
        await userService.updateUser(user.uid, {
          username,
          leetcodeId,
          createdAt: new Date().toISOString(),
        });
        // Update the local user object
        setUser((prev) => ({ ...prev, username, leetcodeId }));
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
