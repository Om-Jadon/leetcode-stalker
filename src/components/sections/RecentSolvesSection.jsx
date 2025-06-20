import React from "react";

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

export default function RecentSolvesSection({
  filterMode,
  onFilterModeChange,
  usernames,
  statsMap,
}) {
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
          <h3 className="text-sm font-semibold text-white">Latest Solves</h3>
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
