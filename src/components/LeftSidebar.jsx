import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LargeSpinnerSkeleton } from "./LoadingSkeleton";
import {
  friendsService,
  friendRequestsService,
  chatService,
  userService,
} from "../firebase/firestore";

export default function LeftSidebar({
  isOpen,
  onToggle,
  onOpenProfileSetup,
  authLoading,
}) {
  const { user, signInWithGoogle, hasCompleteProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  // Chat state
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatUnsubscribe, setChatUnsubscribe] = useState(null);
  const chatMessagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive, when switching to chat tab, or when sidebar opens
  useEffect(() => {
    if (chatMessagesEndRef.current && activeTab === "chat") {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab, isOpen]);

  // Load user's friends from Firebase
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

  // Load friend requests
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

  // Load friends and requests when user changes
  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
    }
  }, [user, loadFriends, loadFriendRequests]);

  // Clean up chat subscription when component unmounts or user changes
  useEffect(() => {
    return () => {
      if (chatUnsubscribe) {
        console.log("Cleaning up chat subscription");
        chatUnsubscribe();
      }
    };
  }, [chatUnsubscribe]);

  // Search functionality
  const handleSearchInputChange = async (value) => {
    setSearchQuery(value);

    if (value.trim().length >= 2 && user) {
      setIsSearching(true);
      try {
        const suggestedUsers = await friendsService.searchUsersWithSuggestions(
          value.trim()
        );

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
      console.log("Friend request sent successfully!");
    } catch (error) {
      console.error("Error sending friend request:", error);
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
        await loadFriends();
      } else {
        await friendRequestsService.declineFriendRequest(requestId);
      }
      await loadFriendRequests();
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
    }
  };

  // Chat functionality
  const openChat = async (friend) => {
    console.log("Opening chat with:", friend.username);

    // Clean up previous chat listener
    if (chatUnsubscribe) {
      console.log("Cleaning up previous chat subscription");
      chatUnsubscribe();
      setChatUnsubscribe(null);
    }

    setSelectedFriend(friend);
    setActiveTab("chat");
    setChatMessages([]); // Clear previous messages

    try {
      // Load initial messages
      console.log("Loading initial messages...");
      const messages = await chatService.getChatMessages(user.uid, friend.id);
      console.log("Initial messages loaded:", messages.length);
      setChatMessages(messages);

      // Mark messages as read
      await chatService.markMessagesAsRead(user.uid, friend.id, user.uid);

      // Set up real-time listener for new messages
      console.log("Setting up real-time listener...");
      const unsubscribe = chatService.onChatMessages(
        user.uid,
        friend.id,
        (snapshot) => {
          console.log("Real-time update received, processing...");
          const newMessages = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            let timestamp = data.timestamp;

            // Handle different timestamp formats
            if (timestamp?.seconds) {
              timestamp = timestamp.seconds * 1000;
            } else if (timestamp?.toMillis) {
              timestamp = timestamp.toMillis();
            } else if (!timestamp) {
              timestamp = Date.now();
            }

            newMessages.push({
              id: doc.id,
              ...data,
              timestamp,
            });
          });

          // Sort messages by timestamp
          newMessages.sort((a, b) => a.timestamp - b.timestamp);

          console.log("Setting new messages:", newMessages.length);
          setChatMessages(newMessages);

          // Auto-mark new messages as read
          chatService.markMessagesAsRead(user.uid, friend.id, user.uid);
        }
      );

      console.log("Real-time listener set up successfully");
      setChatUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error("Error setting up chat:", error);
    }
  };

  const sendMessage = async (messageType = "text", content = null) => {
    const messageContent = content || newMessage.trim();
    if (!messageContent || !selectedFriend || !user) return;

    if (!content) setNewMessage(""); // Clear input only if not using quick action

    try {
      console.log("Sending message:", messageContent, "Type:", messageType);
      await chatService.sendMessage(
        user.uid,
        selectedFriend.id,
        messageContent,
        messageType
      );
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      if (!content) setNewMessage(messageContent); // Restore message if sending failed
    }
  };

  // Quick action functions
  const sendQuickMessage = (message) => {
    sendMessage("text", message);
  };

  const shareProblem = () => {
    const input = prompt("Enter LeetCode problem URL or number:");
    if (!input) return;

    let problemUrl = input.trim();

    // If it's just a number, convert to LeetCode URL
    if (/^\d+$/.test(problemUrl)) {
      problemUrl = `https://leetcode.com/problems/${problemUrl}/`;
    }

    // If it doesn't contain leetcode.com, try to format it
    if (!problemUrl.includes("leetcode.com") && problemUrl.length > 0) {
      problemUrl = `https://leetcode.com/problems/${problemUrl}/`;
    }

    if (problemUrl.includes("leetcode.com")) {
      sendMessage("problem", problemUrl);
    } else {
      alert("Please enter a valid LeetCode problem URL or number");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render different message types
  const renderMessage = (msg) => {
    const isFromMe = msg.fromUserId === user?.uid;
    const timestamp =
      typeof msg.timestamp === "number" ? msg.timestamp : Date.now();

    const baseClasses = `max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${
      isFromMe ? "bg-amber-600 text-white" : "bg-neutral-700 text-neutral-100"
    }`;

    const content = (() => {
      switch (msg.messageType) {
        case "problem":
          if (msg.message.includes("leetcode.com")) {
            // Extract problem title from URL
            const urlParts = msg.message.split("/problems/");
            let problemTitle = "LeetCode Problem";

            if (urlParts.length > 1) {
              const problemSlug = urlParts[1].split("/")[0];
              problemTitle = problemSlug
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
            }

            return (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🧩</span>
                  <span className="text-xs font-medium bg-blue-500/20 px-2 py-1 rounded">
                    Problem Shared
                  </span>
                </div>
                <a
                  href={msg.message}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline hover:no-underline block mb-1 font-medium"
                >
                  {problemTitle}
                </a>
                <p className="text-xs opacity-80">Click to open in LeetCode</p>
              </div>
            );
          }
          break;
        default:
          return <p className="text-sm">{msg.message}</p>;
      }
    })();

    return (
      <div
        key={msg.id}
        className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
      >
        <div className={baseClasses}>
          {content}
          <p className="text-xs opacity-70 mt-2">{formatTime(timestamp)}</p>
        </div>
      </div>
    );
  };

  const goBackToFriends = () => {
    // Clean up chat subscription when going back
    if (chatUnsubscribe) {
      console.log("Cleaning up chat subscription on back");
      chatUnsubscribe();
      setChatUnsubscribe(null);
    }
    setSelectedFriend(null);
    setChatMessages([]);
    setActiveTab("friends");
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
        } w-full max-w-sm md:w-96`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white truncate">
            {activeTab === "chat" && selectedFriend
              ? `Chat with ${selectedFriend.username}`
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

        {/* Content */}
        {authLoading ? (
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
        ) : activeTab === "chat" && selectedFriend ? (
          // Chat View
          <div className="flex-1 flex flex-col min-h-0">
            {/* Back button and friend info */}
            <div className="p-3 border-b border-neutral-700">
              <button
                onClick={goBackToFriends}
                className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-2 cursor-pointer mb-2"
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
              {selectedFriend.leetcodeId && (
                <div className="text-xs text-neutral-400 pl-6">
                  LeetCode: {selectedFriend.leetcodeId}
                </div>
              )}
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0"
              style={{ minHeight: "100px" }}
            >
              {chatMessages.length === 0 ? (
                <div className="text-center text-neutral-400 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg) => renderMessage(msg))
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-neutral-700">
              <div className="flex gap-2 text-xs">
                <button
                  onClick={shareProblem}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  <span>🧩</span>
                  <span>Problem</span>
                </button>
                <button
                  onClick={() =>
                    sendQuickMessage("Good luck with your coding! 💪")
                  }
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                >
                  <span>💪</span>
                  <span>Motivate</span>
                </button>
              </div>
              <div className="flex gap-2 text-xs mt-2">
                <button
                  onClick={() =>
                    sendQuickMessage(
                      "Want to do a daily challenge together? 🤝"
                    )
                  }
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-600 hover:bg-neutral-500 text-white rounded transition-colors text-xs"
                >
                  Daily?
                </button>
                <button
                  onClick={() =>
                    sendQuickMessage("Stuck on a problem? Need help? 🤔")
                  }
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-600 hover:bg-neutral-500 text-white rounded transition-colors text-xs"
                >
                  Help?
                </button>
                <button
                  onClick={() =>
                    sendQuickMessage("Great job on your recent solves! 👏")
                  }
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-600 hover:bg-neutral-500 text-white rounded transition-colors text-xs"
                >
                  Congrats!
                </button>
                <button
                  onClick={() =>
                    sendQuickMessage(
                      "Check out my latest progress on LeetCode! 📊"
                    )
                  }
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-600 hover:bg-neutral-500 text-white rounded transition-colors text-xs"
                >
                  My Stats
                </button>
              </div>
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-neutral-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
          // Friends/Search/Requests View
          <div className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="p-3 border-b border-neutral-700">
              <div className="flex space-x-1 bg-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("friends")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    activeTab === "friends"
                      ? "bg-amber-600 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  Friends
                </button>
                <button
                  onClick={() => setActiveTab("search")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    activeTab === "search"
                      ? "bg-amber-600 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  Search
                </button>
                <button
                  onClick={() => setActiveTab("requests")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors relative cursor-pointer ${
                    activeTab === "requests"
                      ? "bg-amber-600 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  Requests
                  {friendRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                      {friendRequests.length > 9 ? "9+" : friendRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Friends Tab */}
              {activeTab === "friends" && (
                <div className="p-4">
                  {friends.length === 0 ? (
                    <div className="text-center text-neutral-400 mt-8">
                      <p>No friends yet. Search for users to add them!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          onClick={() => openChat(friend)}
                          className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white font-medium">
                              {friend.username}
                            </p>
                            {friend.leetcodeId && (
                              <p className="text-neutral-400 text-sm">
                                LeetCode: {friend.leetcodeId}
                              </p>
                            )}
                          </div>
                          <svg
                            className="w-5 h-5 text-neutral-400"
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
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Search Tab */}
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
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-600 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isSearching ? "..." : "Search"}
                      </button>
                    </div>

                    {/* Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-16 z-50 mt-1 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                              <div className="text-neutral-400 text-xs">
                                LeetCode: {suggestion.leetcodeId}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-3 bg-neutral-800 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white">{result.username}</p>
                          {result.leetcodeId && (
                            <p className="text-neutral-400 text-sm">
                              LeetCode: {result.leetcodeId}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => sendFriendRequest(result.id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded transition-colors cursor-pointer"
                        >
                          Add Friend
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === "requests" && (
                <div className="p-4">
                  {friendRequests.length === 0 ? (
                    <div className="text-center text-neutral-400 mt-8">
                      <p>No pending friend requests</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friendRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-3 bg-neutral-800 rounded-lg"
                        >
                          <div className="mb-3">
                            <p className="text-white font-medium">
                              {request.fromUser.username}
                            </p>
                            {request.fromUser.leetcodeId && (
                              <p className="text-neutral-400 text-sm">
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
                              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors cursor-pointer"
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
                              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
