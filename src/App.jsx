// App.jsx
import React, { useEffect, useState, useCallback } from "react";
import FriendCard from "./components/FriendCard";
import AddFriendForm from "./components/AddFriendForm";
import RecentSolvesBox from "./components/RecentSolvesBox";
import QuestionOfTheDayBox from "./components/QuestionOfTheDayBox";
import Notification from "./components/Notification";
import { fetchLeetcodeStats, checkUserExists } from "./api/fetchLeetcodeStats";

export default function App() {
  const [usernames, setUsernames] = useState(
    () => JSON.parse(localStorage.getItem("leetcodeUsers")) || []
  );
  const [statsMap, setStatsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(new Set());
  const [errorUsers, setErrorUsers] = useState(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  const [filterMode, setFilterMode] = useState(
    () => localStorage.getItem("recentSolvesFilterMode") || "24hours"
  );
  const [notification, setNotification] = useState(null);

  const loadStats = useCallback(
    async (username, mode = filterMode) => {
      try {
        const stats = await fetchLeetcodeStats(username, mode);
        setStatsMap((prev) => ({ ...prev, [username]: stats }));
        setErrorUsers((prev) => {
          const next = new Set(prev);
          next.delete(username);
          return next;
        });
      } catch (err) {
        console.error("Error loading stats for", username, err);
        setErrorUsers((prev) => new Set([...prev, username]));
      }
    },
    [filterMode]
  );

  const reloadAll = useCallback(async () => {
    // Trigger refresh for Question of the Day and Recent Solves
    setRefreshTrigger(Date.now());

    setIsLoading(true);
    setErrorUsers(new Set());
    // Set loading state for all users during refresh
    setLoadingUsers(new Set(usernames));

    try {
      await Promise.all(
        usernames.map((username) => loadStats(username, filterMode))
      );
    } finally {
      setIsLoading(false);
      // Clear loading state for all users after refresh
      setLoadingUsers(new Set());
    }
  }, [usernames, filterMode, loadStats]);

  // Toggle filter mode and save to localStorage
  const toggleFilterMode = () => {
    const newMode = filterMode === "24hours" ? "today" : "24hours";
    setFilterMode(newMode);
    localStorage.setItem("recentSolvesFilterMode", newMode);
    // Trigger a refresh to update the data with new filter
    reloadAll();
  };

  useEffect(() => {
    if (usernames.length > 0) {
      // Stagger initial loading to avoid overwhelming the API
      const loadUsersSequentially = async () => {
        setIsLoading(true);
        setLoadingUsers(new Set(usernames));

        for (let i = 0; i < usernames.length; i++) {
          const username = usernames[i];
          await loadStats(username, filterMode);

          // Add delay between users (except for the last one)
          if (i < usernames.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        }

        setIsLoading(false);
        setLoadingUsers(new Set());
      };

      loadUsersSequentially();
    }
    const interval = setInterval(() => {
      if (usernames.length > 0) {
        reloadAll();
      }
    }, 600000);
    return () => clearInterval(interval);
  }, [usernames, reloadAll]);

  async function addUser(username) {
    if (username && !usernames.includes(username)) {
      // Check if user exists first
      const userExists = await checkUserExists(username);

      if (!userExists) {
        setNotification({
          type: "error",
          message: `User "${username}" does not exist on LeetCode. Please check the username and try again.`,
        });
        return;
      }

      const updated = [...usernames, username];
      setUsernames(updated);
      localStorage.setItem("leetcodeUsers", JSON.stringify(updated));

      // Set loading state for this specific user
      setLoadingUsers((prev) => new Set([...prev, username]));

      try {
        await loadStats(username, filterMode);
        setNotification({
          type: "success",
          message: `Successfully added ${username}!`,
        });
      } catch {
        setNotification({
          type: "error",
          message: `Failed to load stats for ${username}. Please try again.`,
        });
      } finally {
        setLoadingUsers((prev) => {
          const next = new Set(prev);
          next.delete(username);
          return next;
        });
      }
    } else if (usernames.includes(username)) {
      setNotification({
        type: "warning",
        message: `User "${username}" is already added.`,
      });
    }
  }

  function removeUser(username) {
    const updated = usernames.filter((user) => user !== username);
    setUsernames(updated);
    localStorage.setItem("leetcodeUsers", JSON.stringify(updated));
    setStatsMap((prev) => {
      const newMap = { ...prev };
      delete newMap[username];
      return newMap;
    });
    // Clean up loading and error states
    setLoadingUsers((prev) => {
      const next = new Set(prev);
      next.delete(username);
      return next;
    });
    setErrorUsers((prev) => {
      const next = new Set(prev);
      next.delete(username);
      return next;
    });
  }

  async function retryUser(username) {
    setLoadingUsers((prev) => new Set([...prev, username]));
    await loadStats(username, filterMode);
    setLoadingUsers((prev) => {
      const next = new Set(prev);
      next.delete(username);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
      {/* Question of the Day Box */}
      <QuestionOfTheDayBox
        usernames={usernames}
        refreshTrigger={refreshTrigger}
      />

      {/* Recent Solves Box */}
      <RecentSolvesBox
        statsMap={statsMap}
        usernames={usernames}
        loadingUsers={loadingUsers}
      />

      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            LeetCode Stalker
          </h1>
          <p className="text-base sm:text-lg text-gray-300">
            Stalk them up, Bring them down
          </p>
        </header>

        <div className="mb-8 sm:mb-10 max-w-2xl mx-auto">
          <AddFriendForm addFriend={addUser} />
          <div className="flex justify-center items-center gap-4 mt-6 sm:mt-10">
            <button
              onClick={reloadAll}
              disabled={isLoading || usernames.length === 0}
              className={`flex items-center gap-2 ${
                isLoading || usernames.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-md transition-all cursor-pointer text-sm sm:text-base`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                "Refresh All Stats"
              )}
            </button>
            {/* Filter Mode Toggle Button beside refresh button */}
            {usernames.length > 0 && (
              <button
                onClick={toggleFilterMode}
                className="flex items-center gap-2 bg-gray-800/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 hover:bg-gray-700/95 transition-colors text-sm font-medium cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>{filterMode === "24hours" ? "Last 24h" : "Today"}</span>
              </button>
            )}
          </div>
        </div>

        {usernames.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-gray-800 rounded-xl shadow-sm border border-gray-700 mx-4 sm:mx-0">
            <div className="max-w-md mx-auto px-4">
              <svg
                className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="mt-2 text-base sm:text-lg font-medium text-white">
                No friends added yet
              </h3>
              <p className="mt-1 text-sm sm:text-base text-gray-400">
                Add LeetCode usernames to track their progress
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {usernames
              .sort((a, b) => {
                const statsA = statsMap[a] || {};
                const statsB = statsMap[b] || {};
                const recentA = statsA.recentSolved || 0;
                const recentB = statsB.recentSolved || 0;

                // Sort by recent activity first (descending), then by username (ascending) for consistent ordering
                if (recentB !== recentA) {
                  return recentB - recentA;
                }
                return a.localeCompare(b);
              })
              .map((user) => (
                <FriendCard
                  key={user}
                  user={user}
                  stats={statsMap[user] || {}}
                  onRemove={() => removeUser(user)}
                  isLoading={loadingUsers.has(user)}
                  hasError={errorUsers.has(user)}
                  onRetry={() => retryUser(user)}
                  filterMode={filterMode}
                />
              ))}
          </div>
        )}
      </div>
      <footer className="text-center mt-12 sm:mt-16 text-sm sm:text-base text-gray-400 px-4">
        <hr className="my-4 sm:my-6 border-gray-600" />
        <p className="flex flex-col items-center gap-2">
          <a
            href="https://github.com/Om-Jadon/leetcode-stalker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-400 hover:underline gap-2"
          >
            <svg
              className="w-5 h-5 text-indigo-400"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.853 0 1.337-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.138 20.203 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            View on GitHub
          </a>
          <span>
            Want to help?{" "}
            <a
              href="https://github.com/Om-Jadon/leetcode-stalker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              Contribute on GitHub!
            </a>
          </span>
        </p>
      </footer>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
