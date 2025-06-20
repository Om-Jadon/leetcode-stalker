import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LargeSpinnerSkeleton } from "./LoadingSkeleton";
import {
  friendsService,
  friendRequestsService,
  chatService,
  userService,
} from "../firebase/firestore";

export default function LeftSidebar({ isOpen, onToggle, onOpenProfileSetup }) {
  const { user, signInWithGoogle, loading, hasCompleteProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("friends"); // 'friends', 'search', 'requests', 'chat'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatUnsubscribe, setChatUnsubscribe] = useState(null);

  // Load user's friends from Firebase (only for authenticated users)
  const loadFriends = useCallback(async () => {
    if (!user) return;
    try {
      const friendIds = await friendsService.getFriends(user.uid);
      const friendsData = [];

      for (const friendId of friendIds) {
        const friendData = await userService.getUser(friendId);
        if (friendData) {
          friendsData.push(friendData);
        }
      }

      setFriends(friendsData);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  }, [user]);

  const loadFriendRequests = useCallback(async () => {
    if (!user) return;
    try {
      const requests = await friendRequestsService.getPendingRequests(user.uid);
      const requestsWithUserData = [];

      for (const request of requests) {
        const userData = await userService.getUser(request.fromUserId);
        if (userData) {
          requestsWithUserData.push({
            ...request,
            fromUser: userData,
          });
        }
      }

      setFriendRequests(requestsWithUserData);
    } catch (error) {
      console.error("Error loading friend requests:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
    }
  }, [user, loadFriends, loadFriendRequests]);

  // Handle search input changes and provide suggestions
  const handleSearchInputChange = async (value) => {
    setSearchQuery(value);

    if (value.trim().length >= 2 && user) {
      setIsSearching(true);
      try {
        const suggestedUsers = await friendsService.searchUsersWithSuggestions(
          value.trim()
        );

        // Filter out current user and existing friends
        const filteredSuggestions = suggestedUsers.filter(
          (u) => u.id !== user.uid && !friends.some((f) => f.id === u.id)
        );

        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error getting suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const users = await friendsService.searchUsersWithSuggestions(
        searchQuery.trim()
      );

      // Filter out current user and existing friends
      const filteredUsers = users.filter(
        (u) => u.id !== user.uid && !friends.some((f) => f.id === u.id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.username || "");
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const sendFriendRequest = async (toUserId) => {
    try {
      await friendRequestsService.sendFriendRequest(user.uid, toUserId);
      setSearchResults([]);
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);

      // You could add a success notification here if you have a notification system
      console.log("Friend request sent successfully!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      // You could add an error notification here
    }
  };

  const handleFriendRequest = async (requestId, fromUserId, action) => {
    try {
      if (action === "accept") {
        await friendRequestsService.acceptFriendRequest(
          requestId,
          fromUserId,
          user.uid
        );
        await loadFriends(); // Refresh friends list
      } else {
        await friendRequestsService.declineFriendRequest(requestId);
      }
      await loadFriendRequests(); // Refresh requests list
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
    }
  };

  const openChat = async (friend) => {
    // Clean up previous chat listener
    if (chatUnsubscribe) {
      chatUnsubscribe();
      setChatUnsubscribe(null);
    }

    setSelectedFriend(friend);
    setActiveTab("chat");

    try {
      // Load initial messages
      const messages = await chatService.getChatMessages(user.uid, friend.id);
      setChatMessages(messages);

      // Mark messages as read
      await chatService.markMessagesAsRead(user.uid, friend.id, user.uid);

      // Set up real-time listener for new messages
      const unsubscribe = chatService.onChatMessages(
        user.uid,
        friend.id,
        (snapshot) => {
          const newMessages = [];
          snapshot.forEach((doc) => {
            newMessages.push({ id: doc.id, ...doc.data() });
          });
          setChatMessages(newMessages);

          // Auto-mark new messages as read
          chatService.markMessagesAsRead(user.uid, friend.id, user.uid);
        }
      );

      setChatUnsubscribe(unsubscribe);
    } catch (error) {
      console.error("Error loading chat messages:", error);
    }
  };

  // Clean up chat listener when component unmounts or user changes
  useEffect(() => {
    return () => {
      if (chatUnsubscribe) {
        chatUnsubscribe();
      }
    };
  }, [chatUnsubscribe]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    try {
      await chatService.sendMessage(user.uid, selectedFriend.id, messageText);
      // Real-time listener will update the messages automatically
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore message if sending failed
      setNewMessage(messageText);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-4 z-40 p-2 bg-neutral-800 rounded-lg border border-neutral-700 hover:bg-neutral-700 transition-colors cursor-pointer"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-neutral-900 border-r border-neutral-700 z-40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          /* Responsive width */
          "w-full max-w-sm md:w-96"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white truncate">
            {activeTab === "chat"
              ? `Chat with ${
                  selectedFriend?.leetcodeId ||
                  selectedFriend?.username ||
                  "Friend"
                }`
              : "Friends"}
          </h2>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-white transition-colors focus-ring touch-target cursor-pointer"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <LargeSpinnerSkeleton />
              <p className="text-neutral-400 text-sm">Loading...</p>
            </div>
          </div>
        ) : !user ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Sign in with Google to connect with friends and enable chat
              </p>
              <button
                onClick={signInWithGoogle}
                className="bg-amber-600 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        ) : !hasCompleteProfile ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <svg
                className="w-12 h-12 text-amber-500 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-white mb-2 font-medium">
                  Complete Your Profile
                </p>
                <p className="text-neutral-400 text-sm mb-4">
                  Set up your username and LeetCode ID to access chat features
                </p>
              </div>
              <button
                onClick={onOpenProfileSetup}
                className="bg-amber-600 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Complete Profile
              </button>
            </div>
          </div>
        ) : activeTab === "chat" ? (
          // Chat View
          <div className="flex-1 flex flex-col">
            <div className="p-2">
              <button
                onClick={() => setActiveTab("friends")}
                className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to friends
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => {
                const isFromMe = msg.fromUserId === user?.uid;
                // Safe timestamp handling
                let timestamp;
                if (msg.timestamp?.seconds) {
                  timestamp = msg.timestamp.seconds * 1000;
                } else if (msg.timestamp && typeof msg.timestamp === "number") {
                  timestamp = msg.timestamp;
                } else {
                  timestamp = Date.now(); // Fallback to current time
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isFromMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        isFromMe
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-200"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-3 py-2 bg-amber-600 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Friends/Search View
          <div className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="p-3 md:p-4 border-b border-neutral-700">
              <div className="flex space-x-1 bg-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("friends")}
                  className={`flex-1 px-2 md:px-3 py-2 text-xs md:text-sm rounded-md transition-colors focus-ring touch-target cursor-pointer ${
                    activeTab === "friends"
                      ? "bg-amber-600 text-white shadow-glow"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  Friends
                </button>
                <button
                  onClick={() => setActiveTab("search")}
                  className={`flex-1 px-2 md:px-3 py-2 text-xs md:text-sm rounded-md transition-colors focus-ring touch-target cursor-pointer ${
                    activeTab === "search"
                      ? "bg-amber-600 text-white shadow-glow"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  Search
                </button>
                <button
                  onClick={() => setActiveTab("requests")}
                  className={`flex-1 px-2 md:px-3 py-2 text-xs md:text-sm rounded-md transition-colors relative focus-ring touch-target cursor-pointer ${
                    activeTab === "requests"
                      ? "bg-amber-600 text-white shadow-glow"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  <span className="hidden sm:inline">Requests</span>
                  <span className="sm:hidden">Req</span>
                  {friendRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                      {friendRequests.length > 9 ? "9+" : friendRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "search" && (
                <div className="p-4">
                  <div className="relative mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) =>
                          handleSearchInputChange(e.target.value)
                        }
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        onFocus={() =>
                          setShowSuggestions(suggestions.length > 0)
                        }
                        onBlur={() =>
                          setTimeout(() => setShowSuggestions(false), 150)
                        }
                        placeholder="Search by username..."
                        className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-3 py-2 bg-amber-600 hover:bg-orange-600 disabled:bg-neutral-600 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isSearching ? "..." : "Search"}
                      </button>
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-14 z-50 mt-1 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            onClick={() => selectSuggestion(suggestion)}
                            className="p-3 hover:bg-neutral-700 cursor-pointer border-b border-neutral-700 last:border-b-0"
                          >
                            <div className="text-white text-sm">
                              {suggestion.username}
                            </div>
                            {suggestion.leetcodeId && (
                              <div className="text-gray-400 text-xs">
                                LeetCode: {suggestion.leetcodeId}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Loading indicator for suggestions */}
                    {isSearching && searchQuery.length >= 2 && (
                      <div className="absolute top-full left-0 right-14 z-50 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-3">
                        <div className="text-gray-400 text-sm text-center">
                          Searching...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-3 bg-gray-800 rounded-lg mb-2 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-white block">
                          {result.username}
                        </span>
                        {result.leetcodeId && (
                          <span className="text-gray-400 text-sm">
                            LeetCode: {result.leetcodeId}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => sendFriendRequest(result.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-orange-600 text-white text-sm rounded transition-colors cursor-pointer"
                      >
                        Send Request
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "requests" && (
                <div className="p-4">
                  {friendRequests.length === 0 ? (
                    <p className="text-neutral-400 text-center">
                      No pending requests
                    </p>
                  ) : (
                    friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-3 bg-neutral-800 rounded-lg mb-2"
                      >
                        <div className="mb-2">
                          <p className="text-white">
                            {request.fromUser.username}
                          </p>
                          {request.fromUser.leetcodeId && (
                            <p className="text-gray-400 text-sm">
                              LeetCode: {request.fromUser.leetcodeId}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleFriendRequest(
                                request.id,
                                request.fromUserId,
                                "accept"
                              )
                            }
                            className="px-3 py-1 bg-amber-600 hover:bg-orange-600 text-white text-sm rounded transition-colors cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleFriendRequest(
                                request.id,
                                request.fromUserId,
                                "decline"
                              )
                            }
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "friends" && (
                <div className="p-4">
                  {friends.length === 0 ? (
                    <p className="text-neutral-400 text-center">
                      No friends yet
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => openChat(friend)}
                        className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg mb-2 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="text-white block">
                            {friend.username}
                          </span>
                          {friend.leetcodeId && (
                            <span className="text-neutral-400 text-sm">
                              LeetCode: {friend.leetcodeId}
                            </span>
                          )}
                        </div>
                        <svg
                          className="w-4 h-4 text-neutral-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.477 8-10 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.477-8 10-8s10 3.582 10 8z"
                          />
                        </svg>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
