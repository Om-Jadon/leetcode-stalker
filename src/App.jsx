// App.jsx
import React, { useEffect, useState, useCallback } from "react";
import FriendCard from "./components/FriendCard";
import AddFriendForm from "./components/AddFriendForm";
import RecentSolvesBox from "./components/RecentSolvesBox";
import QuestionOfTheDayBox from "./components/QuestionOfTheDayBox";
import { fetchLeetcodeStats } from "./api/fetchLeetcodeStats";

export default function App() {
  const [usernames, setUsernames] = useState(
    () => JSON.parse(localStorage.getItem("leetcodeUsers")) || []
  );
  const [statsMap, setStatsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(new Set());
  const [errorUsers, setErrorUsers] = useState(new Set());

  const reloadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorUsers(new Set());
    // Set loading state for all users during refresh
    setLoadingUsers(new Set(usernames));

    try {
      await Promise.all(usernames.map(loadStats));
    } finally {
      setIsLoading(false);
      // Clear loading state for all users after refresh
      setLoadingUsers(new Set());
    }
  }, [usernames]);

  useEffect(() => {
    if (usernames.length > 0) {
      reloadAll();
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
      const updated = [...usernames, username];
      setUsernames(updated);
      localStorage.setItem("leetcodeUsers", JSON.stringify(updated));

      // Set loading state for this specific user
      setLoadingUsers((prev) => new Set([...prev, username]));
      await loadStats(username);
      setLoadingUsers((prev) => {
        const next = new Set(prev);
        next.delete(username);
        return next;
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

  async function loadStats(username) {
    try {
      const stats = await fetchLeetcodeStats(username);
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
  }

  async function retryUser(username) {
    setLoadingUsers((prev) => new Set([...prev, username]));
    await loadStats(username);
    setLoadingUsers((prev) => {
      const next = new Set(prev);
      next.delete(username);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
      {/* Question of the Day Box */}
      <QuestionOfTheDayBox usernames={usernames} />

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
          <div className="flex justify-center mt-6 sm:mt-10">
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
                />
              ))}
          </div>
        )}
      </div>
      <footer className="text-center mt-12 sm:mt-16 text-sm sm:text-base text-gray-400 px-4">
        <hr className="my-4 sm:my-6 border-gray-600" />
        <p>
          Developed with <span className="text-red-400">Hatred</span>{" "}
          <span className="inline-block animate-bounce">😈</span>
        </p>
      </footer>
    </div>
  );
}
