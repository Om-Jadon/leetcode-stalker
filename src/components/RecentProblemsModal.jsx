// RecentProblemsModal.jsx
import React from "react";
import Modal from "./Modal";

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

export default function RecentProblemsModal({
  isOpen,
  onClose,
  user,
  problems,
  filterMode = "24hours",
}) {
  const getFilterText = () => {
    return filterMode === "today" ? "Today" : "Last 24h";
  };

  const getEmptyStateText = () => {
    return filterMode === "today"
      ? "No problems solved today"
      : "No problems solved in the last 24 hours";
  };

  if (!problems || problems.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${user}'s Recent Problems`}
      >
        <div className="text-center py-8">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-300">
            No recent problems
          </h3>
          <p className="mt-1 text-sm text-gray-400">{getEmptyStateText()}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${user}'s Problems (${getFilterText()}) - ${problems.length}`}
    >
      <div className="space-y-3">
        {problems.map((problem, i) => {
          const title = typeof problem === "string" ? problem : problem.title;
          const difficulty =
            typeof problem === "object" ? problem.difficulty : "Unknown";
          const colors = getDifficultyColors(difficulty);

          const problemUrl = `https://leetcode.com/problems/${title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-")}/`;

          return (
            <div key={i}>
              <a
                href={problemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-4 rounded-lg hover:bg-gray-600 transition-colors duration-150 cursor-pointer border ${colors.bg} ${colors.border} hover:border-gray-500`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`text-base font-semibold hover:text-indigo-300 transition-colors ${colors.text} pr-2`}
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
                  <div className="text-sm text-gray-300 font-medium">
                    {formatToIST(problem.timestamp)}
                  </div>
                )}
              </a>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
