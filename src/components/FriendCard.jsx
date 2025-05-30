// FriendCard.jsx
import React, { useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import RecentProblemsModal from "./RecentProblemsModal";

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

export default function FriendCard({
  user,
  stats,
  onRemove,
  isLoading,
  hasError,
  onRetry,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (hasError) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-red-700/50 min-h-[350px] sm:min-h-[400px] relative group">
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center h-full text-center">
          <svg
            className="h-12 w-12 sm:h-16 sm:w-16 text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg sm:text-xl font-bold text-red-300 mb-2">
            {user}
          </h3>
          <p className="text-sm sm:text-base text-gray-400 mb-4">
            Failed to load stats
          </p>
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base"
          >
            Try Again
          </button>
          <button
            onClick={onRemove}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-full bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white transition-colors duration-200"
            aria-label="Remove user"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5"
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
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative group border border-gray-700 min-h-[350px] sm:min-h-[400px]">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-full bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Remove user"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5"
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

      <div className="p-6 sm:p-8">
        <div className="flex items-center mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{user}</h2>
            <a
              href={`https://leetcode.com/${user}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-indigo-400 hover:underline"
            >
              View Profile
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 text-center">
          <div className="py-3 sm:py-4 px-2 sm:px-3 bg-green-900/50 rounded-lg border border-green-800">
            <div className="text-xs text-green-400 uppercase font-semibold tracking-wide mb-1 sm:mb-2">
              Easy
            </div>
            <div className="text-lg sm:text-2xl font-bold text-green-300">
              {stats.easySolved || 0}
            </div>
          </div>
          <div className="py-3 sm:py-4 px-2 sm:px-3 bg-yellow-900/50 rounded-lg border border-yellow-800">
            <div className="text-xs text-yellow-400 uppercase font-semibold tracking-wide mb-1 sm:mb-2">
              Medium
            </div>
            <div className="text-lg sm:text-2xl font-bold text-yellow-300">
              {stats.mediumSolved || 0}
            </div>
          </div>
          <div className="py-3 sm:py-4 px-2 sm:px-3 bg-red-900/50 rounded-lg border border-red-800">
            <div className="text-xs text-red-400 uppercase font-semibold tracking-wide mb-1 sm:mb-2">
              Hard
            </div>
            <div className="text-lg sm:text-2xl font-bold text-red-300">
              {stats.hardSolved || 0}
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-medium text-gray-400">
              Total Solved
            </span>
            <span className="font-bold text-white text-base sm:text-lg">
              {stats.totalSolved || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-medium text-gray-400">
              Recent Activity
            </span>
            <span className="font-semibold text-blue-400 text-sm sm:text-base">
              {stats.recentSolved || 0} today
            </span>
          </div>
        </div>

        {stats.recentProblemsForDisplay?.length > 0 && (
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300">
                Recently Solved
              </h3>
              {stats.recentProblems?.length > 3 && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors btn-hover-scale"
                >
                  View All ({stats.recentProblems.length})
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
            <ul className="space-y-2 sm:space-y-3">
              {stats.recentProblemsForDisplay.map((problem, i) => {
                const title =
                  typeof problem === "string" ? problem : problem.title;
                const difficulty =
                  typeof problem === "object" ? problem.difficulty : "Unknown";
                const colors = getDifficultyColors(difficulty);

                const problemUrl = `https://leetcode.com/problems/${title
                  .toLowerCase()
                  .replace(/[^a-z0-9\s]/g, "")
                  .replace(/\s+/g, "-")}/`;

                return (
                  <li key={i}>
                    <a
                      href={problemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block p-3 sm:p-4 rounded-lg hover:bg-gray-600 transition-colors duration-150 cursor-pointer border ${colors.bg} ${colors.border} hover:border-gray-500`}
                    >
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div
                          className={`text-sm sm:text-base font-semibold truncate hover:text-indigo-300 transition-colors ${colors.text} pr-2`}
                        >
                          {title}
                        </div>
                        {difficulty !== "Unknown" && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${colors.badge}`}
                          >
                            {difficulty}
                          </span>
                        )}
                      </div>
                      {typeof problem === "object" && problem.timestamp && (
                        <div className="text-xs sm:text-sm text-gray-300 font-medium">
                          {formatToIST(problem.timestamp)}
                        </div>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Recent Problems Modal */}
      <RecentProblemsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        problems={stats.recentProblems || []}
      />
    </div>
  );
}
