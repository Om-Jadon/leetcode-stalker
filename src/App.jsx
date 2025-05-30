// App.jsx
import React, { useEffect, useState } from "react";
import FriendCard from "./components/FriendCard";
import AddFriendForm from "./components/AddFriendForm";
import { fetchLeetcodeStats } from "./api/fetchLeetcodeStats";

export default function App() {
  const [usernames, setUsernames] = useState(
    () => JSON.parse(localStorage.getItem("leetcodeUsers")) || []
  );
  const [statsMap, setStatsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    reloadAll();
    const interval = setInterval(() => reloadAll(), 600000);
    return () => clearInterval(interval);
  }, [usernames]);

  async function addUser(username) {
    if (username && !usernames.includes(username)) {
      const updated = [...usernames, username];
      setUsernames(updated);
      localStorage.setItem("leetcodeUsers", JSON.stringify(updated));
      await loadStats(username);
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
  }

  async function loadStats(username) {
    try {
      const stats = await fetchLeetcodeStats(username);
      setStatsMap((prev) => ({ ...prev, [username]: stats }));
    } catch (err) {
      console.error("Error loading stats for", username, err);
    }
  }

  async function reloadAll() {
    setIsLoading(true);
    try {
      await Promise.all(usernames.map(loadStats));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            LeetCode Stalker
          </h1>
          <p className="text-lg text-gray-600">
            Stalk them up, Bring them down
          </p>
        </header>

        <div className="mb-10 max-w-2xl mx-auto">
          <AddFriendForm addFriend={addUser} />
          <div className="flex justify-center mt-10">
            <button
              onClick={reloadAll}
              disabled={isLoading || usernames.length === 0}
              className={`flex items-center gap-2 ${
                isLoading || usernames.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white font-medium px-5 py-2.5 rounded-lg shadow-md transition-all cursor-pointer`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No friends added yet
              </h3>
              <p className="mt-1 text-gray-500">
                Add LeetCode usernames to track their progress
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usernames.map((user) => (
              <FriendCard
                key={user}
                user={user}
                stats={statsMap[user] || {}}
                onRemove={() => removeUser(user)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
