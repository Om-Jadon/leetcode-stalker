import React from "react";
import ProfileSection from "./sections/ProfileSection";
import RecentSolvesSection from "./sections/RecentSolvesSection";
import QuestionOfTheDaySection from "./sections/QuestionOfTheDaySection";

export default function RightSidebar({
  isOpen,
  mode = "profile", // "profile", "recent-solves", "qotd"
  onToggle,
  onClose,
  filterMode,
  onFilterModeChange,
  usernames,
  statsMap,
  refreshTrigger,
  onOpenProfileSetup,
  authLoading,
}) {
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
      case "recent-solves":
        return (
          <RecentSolvesSection
            filterMode={filterMode}
            onFilterModeChange={onFilterModeChange}
            usernames={usernames}
            statsMap={statsMap}
          />
        );

      case "qotd":
        return (
          <QuestionOfTheDaySection
            usernames={usernames}
            refreshTrigger={refreshTrigger}
          />
        );

      default: // profile mode
        return (
          <ProfileSection
            filterMode={filterMode}
            onFilterModeChange={onFilterModeChange}
            onOpenProfileSetup={onOpenProfileSetup}
            authLoading={authLoading}
          />
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
