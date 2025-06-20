import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  friendsService,
  friendRequestsService,
  chatService,
  userService,
} from "../firebase";

export default function SidebarFeatureTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test, result, details = "") => {
    setTestResults((prev) => [
      ...prev,
      { test, result, details, timestamp: new Date() },
    ]);
  };

  const runTests = async () => {
    if (!user) {
      addTestResult(
        "Auth Check",
        "FAIL",
        "User must be signed in with Google to test chat features"
      );
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: User Service
      addTestResult(
        "User Service",
        "RUNNING",
        "Testing user data retrieval..."
      );
      const userData = await userService.getUser(user.uid);
      if (userData) {
        addTestResult(
          "User Service",
          "PASS",
          `User data retrieved: ${userData.email}`
        );
      } else {
        addTestResult("User Service", "FAIL", "No user data found");
      }

      // Test 2: Friends Service
      addTestResult("Friends Service", "RUNNING", "Testing friends list...");
      const friends = await friendsService.getFriends(user.uid);
      addTestResult(
        "Friends Service",
        "PASS",
        `Friends found: ${friends.length}`
      );

      // Test 3: Friend Requests Service
      addTestResult("Friend Requests", "RUNNING", "Testing friend requests...");
      const requests = await friendRequestsService.getPendingRequests(user.uid);
      addTestResult(
        "Friend Requests",
        "PASS",
        `Pending requests: ${requests.length}`
      );

      // Test 4: Search Function
      addTestResult("Search Function", "RUNNING", "Testing user search...");
      try {
        const searchResults = await friendsService.searchUsersByLeetcodeId(
          "test"
        );
        addTestResult(
          "Search Function",
          "PASS",
          `Search completed, found: ${searchResults.length} users`
        );
      } catch (error) {
        addTestResult(
          "Search Function",
          "FAIL",
          `Search error: ${error.message}`
        );
      }

      // Test 5: Chat Service (with dummy data check)
      addTestResult("Chat Service", "RUNNING", "Testing chat functionality...");
      try {
        // Try to get messages (even if empty)
        const messages = await chatService.getChatMessages(
          user.uid,
          "dummy-user-id"
        );
        addTestResult(
          "Chat Service",
          "PASS",
          `Chat service working, messages: ${messages.length}`
        );
      } catch (error) {
        addTestResult("Chat Service", "FAIL", `Chat error: ${error.message}`);
      }
    } catch (error) {
      addTestResult("Test Suite", "FAIL", `General error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (result) => {
    switch (result) {
      case "PASS":
        return "text-green-400";
      case "FAIL":
        return "text-red-400";
      case "RUNNING":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 m-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Sidebar Features Test Suite
      </h3>

      {!user ? (
        <div className="text-red-400 mb-4">
          ⚠️ Please sign in with Google to test chat and friend features
        </div>
      ) : (
        <div className="text-green-400 mb-4">✅ Signed in as: {user.email}</div>
      )}

      <button
        onClick={runTests}
        disabled={isRunning || !user}
        className="mb-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
      >
        {isRunning ? "Running Tests..." : "Run Feature Tests"}
      </button>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {testResults.map((result, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-gray-700 rounded"
          >
            <span className="text-white">{result.test}</span>
            <div className="text-right">
              <span
                className={`font-semibold ${getStatusColor(result.result)}`}
              >
                {result.result}
              </span>
              {result.details && (
                <div className="text-xs text-gray-400 mt-1">
                  {result.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {testResults.length === 0 && !isRunning && (
        <div className="text-gray-400 text-center py-8">
          Click "Run Feature Tests" to check sidebar functionality
        </div>
      )}
    </div>
  );
}
