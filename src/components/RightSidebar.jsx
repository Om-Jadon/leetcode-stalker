import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import LeetCodeIdManager from "./auth/LeetCodeIdManager";
import {
  fetchDailyChallenge,
  checkUserSolvedProblem,
} from "../api/fetchLeetcodeStats";

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
        bg: "bg-neutral-700",
        border: "border-neutral-600",
        text: "text-neutral-300",
        badge: "bg-neutral-600 text-neutral-300",
      };
  }
};

export default function RightSidebar({
  isOpen,
  mode = "profile", // "profile", "recent-solves", "qotd"
  onToggle,
  onClose, // Add onClose prop for the close button
  filterMode,
  onFilterModeChange,
  usernames,
  statsMap,
  refreshTrigger,
  userLeetcodeId,
}) {
  const { user, signInWithGoogle, signOut } = useAuth();

  // State for QOTD
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [userSolveStatus, setUserSolveStatus] = useState({});
  const [isLoadingQOTD, setIsLoadingQOTD] = useState(true);
  const [qotdError, setQotdError] = useState(null);

  // Fetch daily challenge and check user solve status
  useEffect(() => {
    const loadDailyChallenge = async () => {
      if (mode !== "qotd") return;

      try {
        setIsLoadingQOTD(true);
        setQotdError(null);

        const challenge = await fetchDailyChallenge();
        setDailyChallenge(challenge);

        // Check solve status for each user
        const solvePromises = usernames.map(async (username) => {
          try {
            const solved = await checkUserSolvedProblem(
              username,
              challenge.question.titleSlug
            );
            return [username, solved];
          } catch (error) {
            console.error(
              `Error checking solve status for ${username}:`,
              error
            );
            return [username, false];
          }
        });

        const results = await Promise.all(solvePromises);
        const statusMap = Object.fromEntries(results);
        setUserSolveStatus(statusMap);
      } catch (error) {
        console.error("Error loading daily challenge:", error);
        setQotdError("Failed to load daily challenge");
      } finally {
        setIsLoadingQOTD(false);
      }
    };

    loadDailyChallenge();
  }, [mode, usernames, refreshTrigger]);

  // Function to get title based on mode
  const getTitle = () => {
    switch (mode) {
      case "recent-solves":
        return "Recent Solves";
      case "qotd":
        return "Question of the Day";
      default:
        return "Profile";
    }
  };

  // Function to render content based on mode
  const renderContent = () => {
    switch (mode) {
      case "recent-solves": {
        const latestProblems = [];
        const filterDate = new Date();
        if (filterMode === "today") {
          filterDate.setHours(0, 0, 0, 0);
        } else {
          filterDate.setHours(filterDate.getHours() - 24);
        }
        const filterTimestamp = Math.floor(filterDate.getTime() / 1000);

        // Collect all recent problems from all users
        usernames.forEach((username) => {
          const stats = statsMap[username];
          if (stats?.recentProblems?.length > 0) {
            stats.recentProblems.forEach((problem) => {
              if (problem.timestamp >= filterTimestamp) {
                latestProblems.push({
                  ...problem,
                  username,
                });
              }
            });
          }
        });

        // Sort by timestamp (most recent first) and take the latest 10
        latestProblems.sort((a, b) => b.timestamp - a.timestamp);
        const displayProblems = latestProblems.slice(0, 10);

        return (
          <div className="space-y-6">
            {/* Filter Mode Toggle */}
            <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-300 mb-3">
                Time Filter
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onFilterModeChange("24hours")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    filterMode === "24hours"
                      ? "bg-amber-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Last 24h
                </button>
                <button
                  onClick={() => onFilterModeChange("today")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    filterMode === "today"
                      ? "bg-amber-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Recent Solves Content */}
            <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="h-5 w-5 text-amber-400"
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
                <h3 className="text-sm font-semibold text-white">
                  Latest Solves
                </h3>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {displayProblems.length === 0 ? (
                  <p className="text-neutral-400 text-sm text-center py-4">
                    No recent solves found
                  </p>
                ) : (
                  displayProblems.map((problem, index) => {
                    const colors = getDifficultyColors(problem.difficulty);
                    return (
                      <div
                        key={`${problem.username}-${problem.title}-${index}`}
                        className={`p-3 rounded-lg border ${colors.bg} ${colors.border} hover:bg-neutral-600/50 transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-white text-sm font-medium leading-tight flex-1">
                            {problem.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${colors.badge} shrink-0`}
                          >
                            {problem.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-300 text-xs">
                            by {problem.username}
                          </span>
                          <span className="text-neutral-400 text-xs">
                            {formatToIST(problem.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      }

      case "qotd": {
        if (!dailyChallenge) {
          return (
            <div className="space-y-6">
              <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="h-5 w-5 text-amber-400"
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
                  <h3 className="text-sm font-semibold text-white">
                    Today's Question
                  </h3>
                </div>

                {isLoadingQOTD ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                  </div>
                ) : qotdError ? (
                  <p className="text-red-400 text-sm text-center py-4">
                    {qotdError}
                  </p>
                ) : (
                  <p className="text-neutral-400 text-sm text-center py-4">
                    No daily challenge found
                  </p>
                )}
              </div>
            </div>
          );
        }

        const colors = getDifficultyColors(dailyChallenge.question.difficulty);
        const solvedUsers = Object.entries(userSolveStatus).filter(
          ([, solved]) => solved
        );
        const unsolvedUsers = Object.entries(userSolveStatus).filter(
          ([, solved]) => !solved
        );

        return (
          <div className="space-y-6">
            {/* Daily Challenge Card */}
            <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="h-5 w-5 text-amber-400"
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
                <h3 className="text-sm font-semibold text-white">
                  Today's Question
                </h3>
              </div>

              <div
                className={`p-4 rounded-lg border ${colors.bg} ${colors.border} mb-4`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="text-white font-medium text-sm leading-tight flex-1">
                    {dailyChallenge.question.title}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${colors.badge} shrink-0`}
                  >
                    {dailyChallenge.question.difficulty}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-300 text-xs">
                    Problem #{dailyChallenge.question.frontendQuestionId}
                  </span>
                  {dailyChallenge.link && (
                    <a
                      href={dailyChallenge.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-orange-300 text-xs transition-colors"
                    >
                      View Problem →
                    </a>
                  )}
                </div>

                <div className="text-neutral-400 text-xs leading-relaxed">
                  {dailyChallenge.question.content ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          dailyChallenge.question.content.substring(0, 200) +
                          "...",
                      }}
                    />
                  ) : (
                    "No description available"
                  )}
                </div>
              </div>

              {/* User Solve Status */}
              {usernames.length > 0 && (
                <div className="space-y-3">
                  {solvedUsers.length > 0 && (
                    <div>
                      <h5 className="text-green-400 text-xs font-medium mb-2 flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Solved ({solvedUsers.length})
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {solvedUsers.map(([username]) => (
                          <span
                            key={username}
                            className="px-2 py-1 bg-green-900/30 border border-green-700 text-green-300 rounded text-xs"
                          >
                            {username}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {unsolvedUsers.length > 0 && (
                    <div>
                      <h5 className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Not Solved ({unsolvedUsers.length})
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {unsolvedUsers.map(([username]) => (
                          <span
                            key={username}
                            className="px-2 py-1 bg-red-900/30 border border-red-700 text-red-300 rounded text-xs"
                          >
                            {username}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      default: // profile mode
        return (
          <div className="space-y-6">
            {/* User Authentication Section */}
            <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-300 mb-3">
                Authentication
              </h3>
              {!user ? (
                <button
                  onClick={signInWithGoogle}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="text-white font-medium">
                        {user.displayName}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* LeetCode ID Manager */}
            {user && <LeetCodeIdManager userLeetcodeId={userLeetcodeId} />}

            {/* Filter Settings */}
            <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-300 mb-3">
                Recent Solves Filter
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onFilterModeChange("24hours")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    filterMode === "24hours"
                      ? "bg-amber-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Last 24h
                </button>
                <button
                  onClick={() => onFilterModeChange("today")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    filterMode === "today"
                      ? "bg-amber-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Today
                </button>
              </div>
            </div>

            {/* App Info */}
            <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-300 mb-2">
                About
              </h3>
              <p className="text-neutral-400 text-xs mb-3">
                LeetCode Stalker helps you track your friends' coding progress
                and stay motivated together.
              </p>
              <a
                href="https://github.com/Om-Jadon/leetcode-stalker"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-orange-300 text-xs transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.853 0 1.337-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.138 20.203 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        );
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed right-2 md:right-4 top-4 z-40 flex flex-col gap-2">
        {/* Profile button */}
        <button
          onClick={() => onToggle("profile")}
          className="p-2 bg-neutral-800/80 backdrop-blur-sm rounded-lg border border-neutral-700 hover:bg-neutral-700/80 transition-colors shadow-lg focus-ring touch-target cursor-pointer"
          aria-label="Open profile sidebar"
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>

        {/* Recent Solves button */}
        <button
          onClick={() => onToggle("recent-solves")}
          className="p-2 bg-neutral-800/80 backdrop-blur-sm rounded-lg border border-neutral-700 hover:bg-neutral-700/80 transition-colors shadow-lg focus-ring touch-target cursor-pointer"
          aria-label="Open recent solves sidebar"
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>

        {/* Question of the Day button */}
        <button
          onClick={() => onToggle("qotd")}
          className="p-2 bg-neutral-800/80 backdrop-blur-sm rounded-lg border border-neutral-700 hover:bg-neutral-700/80 transition-colors shadow-lg focus-ring touch-target cursor-pointer"
          aria-label="Open question of the day sidebar"
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
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose || (() => onToggle())}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-neutral-900 border-l border-neutral-700 z-40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${
          /* Responsive width */
          "w-full max-w-sm md:w-96"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{getTitle()}</h2>
          <button
            onClick={onClose || (() => onToggle())}
            className="p-1 text-neutral-400 hover:text-white transition-colors focus-ring touch-target cursor-pointer"
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

        <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
      </div>
    </>
  );
}
