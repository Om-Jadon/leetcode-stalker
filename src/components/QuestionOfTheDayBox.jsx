// QuestionOfTheDayBox.jsx
import React, { useState, useEffect } from "react";
import {
  fetchDailyChallenge,
  checkUserSolvedProblem,
} from "../api/fetchLeetcodeStats";

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

export default function QuestionOfTheDayBox({ usernames, refreshTrigger }) {
  // Default to collapsed on all screens (always closed by default on reload)
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [userSolveStatus, setUserSolveStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch daily challenge and check user solve status
  useEffect(() => {
    const loadDailyChallenge = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the daily challenge
        const challenge = await fetchDailyChallenge();
        setDailyChallenge(challenge);

        // Check which users have solved it (sequentially with delay to avoid rate limiting)
        if (usernames.length > 0 && challenge.question.titleSlug) {
          const solveStatuses = [];

          for (const username of usernames) {
            try {
              const hasSolved = await checkUserSolvedProblem(
                username,
                challenge.question.titleSlug
              );
              solveStatuses.push([username, hasSolved]);

              // Add a small delay between requests to avoid rate limiting
              if (usernames.indexOf(username) < usernames.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 200));
              }
            } catch (error) {
              console.error(
                `Error checking solve status for ${username}:`,
                error
              );
              solveStatuses.push([username, false]);
            }
          }

          setUserSolveStatus(Object.fromEntries(solveStatuses));
        }
      } catch (err) {
        console.error("Error loading daily challenge:", err);
        setError("Failed to load daily challenge");
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyChallenge();
  }, [usernames, refreshTrigger]);

  if (usernames.length === 0) {
    return null;
  }

  const colors = dailyChallenge
    ? getDifficultyColors(dailyChallenge.question.difficulty)
    : {};
  const solvedUsers = Object.entries(userSolveStatus).filter(
    ([, solved]) => solved
  );
  const unsolvedUsers = Object.entries(userSolveStatus).filter(
    ([, solved]) => !solved
  );

  return (
    <div
      className="hidden sm:block fixed top-4 left-4 z-40 w-80 max-w-[calc(100vw-2rem)] sm:w-96 lg:w-80 xl:w-96 
                    sm:top-4 sm:left-4"
    >
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400"
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
            <h3 className="text-xs sm:text-sm font-semibold text-white">
              Question of the Day
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
          <div className="p-3 sm:p-4 space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <svg
                  className="animate-spin h-5 w-5 text-orange-400"
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
                <span className="ml-2 text-sm text-gray-300">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : dailyChallenge ? (
              <>
                {/* Problem Info */}
                <div
                  className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <a
                      href={`https://leetcode.com/problems/${dailyChallenge.question.titleSlug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-blue-300 transition-colors line-clamp-2 flex-1"
                    >
                      {dailyChallenge.question.frontendQuestionId}.{" "}
                      {dailyChallenge.question.title}
                    </a>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge} shrink-0`}
                    >
                      {dailyChallenge.question.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      AC Rate: {dailyChallenge.question.acRate.toFixed(1)}%
                    </span>
                    <span>•</span>
                    <span>{dailyChallenge.date}</span>
                  </div>

                  {/* Topic Tags */}
                  {dailyChallenge.question.topicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {dailyChallenge.question.topicTags
                        .slice(0, 3)
                        .map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      {dailyChallenge.question.topicTags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                          +{dailyChallenge.question.topicTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* User Solve Status */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                    Solve Status
                  </h4>

                  {/* Solved Users */}
                  {solvedUsers.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-green-400 font-medium">
                        ✅ Solved ({solvedUsers.length})
                      </p>
                      {solvedUsers.map(([username]) => (
                        <div key={username} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <a
                            href={`https://leetcode.com/${username}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-300 hover:text-white transition-colors"
                          >
                            {username}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unsolved Users */}
                  {unsolvedUsers.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-medium">
                        ⏳ Not Yet Solved ({unsolvedUsers.length})
                      </p>
                      {unsolvedUsers.map(([username]) => (
                        <div key={username} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          <a
                            href={`https://leetcode.com/${username}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            {username}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* All users solved */}
                  {solvedUsers.length === usernames.length &&
                    usernames.length > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-green-900/20 rounded-lg">
                        <span className="text-xl">🎉</span>
                        <span className="text-sm text-green-300">
                          Everyone solved today's challenge!
                        </span>
                      </div>
                    )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">
                  No daily challenge available
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
