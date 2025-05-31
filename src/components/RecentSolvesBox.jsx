// RecentSolvesBox.jsx
import React, { useState } from "react";

// Helper function to format timestamp to IST
const formatToIST = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper function to get difficulty colors
const getDifficultyColors = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return {
        bg: "bg-green-900/30",
        border: "border-green-700",
        text: "text-green-300",
        badge: "bg-green-800 text-green-200",
      };
    case "medium":
      return {
        bg: "bg-yellow-900/30",
        border: "border-yellow-700",
        text: "text-yellow-300",
        badge: "bg-yellow-800 text-yellow-200",
      };
    case "hard":
      return {
        bg: "bg-red-900/30",
        border: "border-red-700",
        text: "text-red-300",
        badge: "bg-red-800 text-red-200",
      };
    default:
      return {
        bg: "bg-gray-700",
        border: "border-gray-600",
        text: "text-gray-300",
        badge: "bg-gray-600 text-gray-300",
      };
  }
};

export default function RecentSolvesBox({ statsMap, usernames, loadingUsers }) {
  // Default to collapsed on all screens (always closed by default on reload)
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Collect all recent problems from all users
  const allRecentProblems = [];
  usernames.forEach((username) => {
    const stats = statsMap[username];
    if (stats?.recentProblems?.length > 0) {
      stats.recentProblems.forEach((problem) => {
        allRecentProblems.push({
          ...problem,
          username,
        });
      });
    }
  });

  // Sort by timestamp (newest first) and take the latest 5
  const latestProblems = allRecentProblems
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  // Check if any users are loading or if we have no data yet
  const hasLoadingUsers = loadingUsers && loadingUsers.size > 0;
  const hasData = Object.keys(statsMap).length > 0;
  const isLoading = !hasData && hasLoadingUsers;

  if (usernames.length === 0) {
    return null;
  }

  return (
    <div
      className="hidden sm:block fixed top-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] sm:w-96 lg:w-80 xl:w-96 
                    sm:top-4 sm:right-4"
    >
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="text-xs sm:text-sm font-semibold text-white">
              Latest Solves
            </h3>
          </div>
          <button
            className="p-1 rounded-full hover:bg-gray-600 transition-colors text-gray-400 hover:text-white"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            <svg
              className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <svg
                  className="animate-spin h-5 w-5 text-indigo-400"
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
                <span className="ml-2 text-sm text-gray-300">
                  Loading recent solves...
                </span>
              </div>
            ) : latestProblems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">
                  No recent solves available
                </p>
              </div>
            ) : (
              latestProblems.map((problem, index) => {
                const colors = getDifficultyColors(problem.difficulty);
                const problemUrl = `https://leetcode.com/problems/${problem.title
                  .toLowerCase()
                  .replace(/[^a-z0-9\s]/g, "")
                  .replace(/\s+/g, "-")}/`;

                return (
                  <div key={`${problem.username}-${problem.title}-${index}`}>
                    <a
                      href={problemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block p-2 sm:p-3 rounded-lg hover:bg-gray-600/50 transition-colors duration-150 cursor-pointer border ${colors.bg} ${colors.border} hover:border-gray-500`}
                    >
                      <div className="flex items-start justify-between mb-1 sm:mb-2">
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-xs sm:text-sm font-semibold truncate hover:text-indigo-300 transition-colors ${colors.text} mb-1`}
                          >
                            {problem.title}
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 text-xs">
                            <span className="text-gray-400 flex-shrink-0">
                              by
                            </span>
                            <a
                              href={`https://leetcode.com/${problem.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 font-medium truncate max-w-[100px] sm:max-w-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {problem.username}
                            </a>
                          </div>
                        </div>
                        {problem.difficulty &&
                          problem.difficulty !== "Unknown" && (
                            <span
                              className={`px-1.5 sm:px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-1 sm:ml-2 ${colors.badge}`}
                            >
                              {problem.difficulty}
                            </span>
                          )}
                      </div>
                      <div className="text-xs text-gray-300 font-medium">
                        {formatToIST(problem.timestamp)}
                      </div>
                    </a>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
