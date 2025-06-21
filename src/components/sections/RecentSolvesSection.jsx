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

export default function RecentSolvesSection({ usernames, statsMap }) {
  const latestProblems = [];

  // Collect all recent problems from all users (no time filtering)
  usernames.forEach((username) => {
    const stats = statsMap[username];
    if (stats?.recentProblems?.length > 0) {
      stats.recentProblems.forEach((problem) => {
        latestProblems.push({
          ...problem,
          username,
        });
      });
    }
  });

  // Sort by timestamp (most recent first) and show the latest 20 problems
  latestProblems.sort((a, b) => b.timestamp - a.timestamp);
  const displayProblems = latestProblems.slice(0, 20);

  return (
    <div className="space-y-2 h-full overflow-y-auto">
      {displayProblems.length === 0 ? (
        <p className="text-neutral-400 text-sm text-center py-8">
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
  );
}
