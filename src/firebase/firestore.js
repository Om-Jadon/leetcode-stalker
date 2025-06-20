// Firestore database operations
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./config";

// User document operations
export const userService = {
  // Create or update user document
  async createUser(userId, userData) {
    try {
      const userRef = doc(db, "users", userId);

      // Check if user already exists
      const existingUserSnap = await getDoc(userRef);

      if (existingUserSnap.exists()) {
        // User exists, only update non-critical fields and ensure we don't overwrite existing data
        const existingData = existingUserSnap.data();
        const updateData = {
          email: userData.email || existingData.email || "",
          lastLogin: serverTimestamp(),
          // Only update username and leetcodeId if they're not already set
          ...((!existingData.username || existingData.username === "") &&
          userData.username
            ? { username: userData.username }
            : {}),
          ...((!existingData.leetcodeId || existingData.leetcodeId === "") &&
          userData.leetcodeId
            ? { leetcodeId: userData.leetcodeId }
            : {}),
          ...userData,
        };

        await updateDoc(userRef, updateData);
        return { id: userId, ...existingData, ...updateData };
      } else {
        // New user, create with all fields
        const userDoc = {
          username: userData.username || "",
          email: userData.email || "",
          leetcodeId: userData.leetcodeId || "", // User's LeetCode username
          trackedUsers: userData.trackedUsers || [], // LeetCode usernames being tracked
          friends: userData.friends || [], // Social connections (user IDs)
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          ...userData,
        };

        await setDoc(userRef, userDoc);
        return userDoc;
      }
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Get user document
  async getUser(userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  // Update user document
  async updateUser(userId, updateData) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Delete user document
  async deleteUser(userId) {
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Listen to user document changes
  onUserSnapshot(userId, callback) {
    const userRef = doc(db, "users", userId);
    return onSnapshot(userRef, callback);
  },
};

// Tracked Users management operations (LeetCode usernames being tracked)
export const trackedUsersService = {
  // Add tracked user to user's tracked list
  async addTrackedUser(userId, leetcodeUsername) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        trackedUsers: arrayUnion(leetcodeUsername),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding tracked user:", error);
      throw error;
    }
  },

  // Remove tracked user from user's tracked list
  async removeTrackedUser(userId, leetcodeUsername) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        trackedUsers: arrayRemove(leetcodeUsername),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error removing tracked user:", error);
      throw error;
    }
  },

  // Get user's tracked users list
  async getTrackedUsers(userId) {
    try {
      const user = await userService.getUser(userId);
      return user?.trackedUsers || [];
    } catch (error) {
      console.error("Error getting tracked users:", error);
      throw error;
    }
  },

  // Update entire tracked users list
  async updateTrackedUsers(userId, trackedUsersList) {
    try {
      await userService.updateUser(userId, { trackedUsers: trackedUsersList });
    } catch (error) {
      console.error("Error updating tracked users list:", error);
      throw error;
    }
  },
};

// Social Friends management operations (app users who are friends)
export const friendsService = {
  // Add friend to user's friends list
  async addFriend(userId, friendUserId) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        friends: arrayUnion(friendUserId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding friend:", error);
      throw error;
    }
  },

  // Remove friend from user's friends list
  async removeFriend(userId, friendUserId) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        friends: arrayRemove(friendUserId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  },

  // Get user's friends list
  async getFriends(userId) {
    try {
      const user = await userService.getUser(userId);
      return user?.friends || [];
    } catch (error) {
      console.error("Error getting friends:", error);
      throw error;
    }
  },

  // Search for users by username (exact match)
  async searchUsersByUsername(username) {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      return users;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  // Search for users with suggestions (partial username matching only)
  async searchUsersWithSuggestions(searchTerm) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const usersRef = collection(db, "users");
      // Get all users and filter client-side for partial matches
      // Note: Firestore doesn't support case-insensitive partial string matching natively
      const querySnapshot = await getDocs(usersRef);

      const users = [];
      const searchLower = searchTerm.toLowerCase();

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const username = userData.username?.toLowerCase() || "";

        // Only search by username for security and data integrity
        if (username.includes(searchLower)) {
          users.push({ id: doc.id, ...userData });
        }
      });

      // Sort by relevance: exact matches first, then starts with, then contains
      users.sort((a, b) => {
        const aUsername = (a.username || "").toLowerCase();
        const bUsername = (b.username || "").toLowerCase();

        // Exact matches first
        if (aUsername === searchLower) return -1;
        if (bUsername === searchLower) return 1;

        // Starts with matches second
        if (aUsername.startsWith(searchLower)) return -1;
        if (bUsername.startsWith(searchLower)) return 1;

        // Contains matches last (alphabetical order)
        return aUsername.localeCompare(bUsername);
      });

      // Limit results to prevent too many matches
      return users.slice(0, 10);
    } catch (error) {
      console.error("Error searching users with suggestions:", error);
      throw error;
    }
  },
};

// Friend Requests management
export const friendRequestsService = {
  // Send friend request
  async sendFriendRequest(fromUserId, toUserId) {
    try {
      const requestRef = doc(collection(db, "friendRequests"));
      await setDoc(requestRef, {
        fromUserId,
        toUserId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      return requestRef.id;
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  },

  // Get pending friend requests for a user
  async getPendingRequests(userId) {
    try {
      const requestsRef = collection(db, "friendRequests");
      const q = query(
        requestsRef,
        where("toUserId", "==", userId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);

      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      return requests;
    } catch (error) {
      console.error("Error getting pending requests:", error);
      throw error;
    }
  },

  // Accept friend request
  async acceptFriendRequest(requestId, fromUserId, toUserId) {
    try {
      // Update request status
      const requestRef = doc(db, "friendRequests", requestId);
      await updateDoc(requestRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      // Add each user to the other's friends list
      await friendsService.addFriend(fromUserId, toUserId);
      await friendsService.addFriend(toUserId, fromUserId);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  },

  // Decline friend request
  async declineFriendRequest(requestId) {
    try {
      const requestRef = doc(db, "friendRequests", requestId);
      await updateDoc(requestRef, {
        status: "declined",
        declinedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error declining friend request:", error);
      throw error;
    }
  },
};

// Chat management
export const chatService = {
  // Send message
  async sendMessage(fromUserId, toUserId, message) {
    try {
      // Create chat ID (consistent ordering)
      const chatId = [fromUserId, toUserId].sort().join("_");

      const messageRef = doc(collection(db, "chats", chatId, "messages"));
      await setDoc(messageRef, {
        fromUserId,
        toUserId,
        message,
        timestamp: serverTimestamp(),
        read: false,
      });

      return messageRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Get chat messages
  async getChatMessages(userId1, userId2) {
    try {
      const chatId = [userId1, userId2].sort().join("_");
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"), limit(50));
      const querySnapshot = await getDocs(q);

      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      return messages;
    } catch (error) {
      console.error("Error getting chat messages:", error);
      throw error;
    }
  },

  // Listen to chat messages
  onChatMessages(userId1, userId2, callback) {
    const chatId = [userId1, userId2].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    return onSnapshot(q, callback);
  },

  // Mark messages as read
  async markMessagesAsRead(userId1, userId2, currentUserId) {
    try {
      const chatId = [userId1, userId2].sort().join("_");
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        where("toUserId", "==", currentUserId),
        where("read", "==", false)
      );
      const querySnapshot = await getDocs(q);

      const updatePromises = [];
      querySnapshot.forEach((doc) => {
        updatePromises.push(updateDoc(doc.ref, { read: true }));
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },
};

// LeetCode ID management operations
export const leetcodeService = {
  // Update user's LeetCode ID
  async updateLeetcodeId(userId, leetcodeId) {
    try {
      await userService.updateUser(userId, { leetcodeId });
    } catch (error) {
      console.error("Error updating LeetCode ID:", error);
      throw error;
    }
  },

  // Get user's LeetCode ID
  async getLeetcodeId(userId) {
    try {
      const user = await userService.getUser(userId);
      return user?.leetcodeId || null;
    } catch (error) {
      console.error("Error getting LeetCode ID:", error);
      return null;
    }
  },

  // Check if user has LeetCode ID set
  async hasLeetcodeId(userId) {
    try {
      const leetcodeId = await this.getLeetcodeId(userId);
      return leetcodeId && leetcodeId.trim() !== "";
    } catch (error) {
      console.error("Error checking LeetCode ID:", error);
      return false;
    }
  },
};

// Data sync operations
export const syncService = {
  // Sync local data to Firestore (for tracked users)
  async syncLocalToCloud(userId, localData) {
    try {
      const { trackedUsers } = localData;

      await userService.updateUser(userId, {
        trackedUsers: trackedUsers || [],
        lastSync: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Error syncing local data to cloud:", error);
      throw error;
    }
  },

  // Sync Firestore data to local storage (for tracked users)
  async syncCloudToLocal(userId) {
    try {
      const userData = await userService.getUser(userId);

      if (userData) {
        // Update localStorage with cloud data for tracked users
        if (userData.trackedUsers) {
          localStorage.setItem(
            "leetcodeUsers",
            JSON.stringify(userData.trackedUsers)
          );
        }

        return userData;
      }

      return null;
    } catch (error) {
      console.error("Error syncing cloud data to local:", error);
      throw error;
    }
  },

  // Get last sync timestamp
  async getLastSync(userId) {
    try {
      const user = await userService.getUser(userId);
      return user?.lastSync || null;
    } catch (error) {
      console.error("Error getting last sync:", error);
      return null;
    }
  },
};
