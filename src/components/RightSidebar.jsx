import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import LeetCodeIdManager from "./auth/LeetCodeIdManager";
import RecentSolvesBox from "./RecentSolvesBox";
import QuestionOfTheDayBox from "./QuestionOfTheDayBox";
import { checkUserExists } from "../api/fetchLeetcodeStats";

export default function RightSidebar({
  isOpen,
  onToggle,
  filterMode,
  onFilterModeChange,
  usernames,
  statsMap,
  refreshTrigger,
  userLeetcodeId,
}) {
  const { user, signInWithGoogle, signOut, createUserProfile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [username, setUsername] = useState("");
  const [leetcodeId, setLeetcodeId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  // Check if user needs onboarding
  const needsOnboarding = user && (!user.username || !user.leetcodeId);

  const handleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result.hasCompleteProfile) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!username.trim() || !leetcodeId.trim()) return;

    setIsVerifying(true);
    setError("");

    try {
      const userExists = await checkUserExists(leetcodeId.trim());
      if (!userExists) {
        setError(
          "This LeetCode username does not exist. Please check and try again."
        );
        setIsVerifying(false);
        return;
      }

      await createUserProfile(username.trim(), leetcodeId.trim());
      localStorage.setItem("userLeetcodeId", leetcodeId.trim());

      setShowOnboarding(false);
      setUsername("");
      setLeetcodeId("");
    } catch (err) {
      console.error("Error completing profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Get LeetCode ID from multiple sources
  const displayLeetCodeId =
    user?.leetcodeId ||
    userLeetcodeId ||
    localStorage.getItem("userLeetcodeId");

  if (!isOpen) {
    return (
      <div className="fixed right-2 md:right-4 top-4 z-40 flex flex-col gap-2">
        {/* Main toggle button */}
        <button
          onClick={onToggle}
          className="p-2 bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 hover:bg-gray-700/80 transition-colors shadow-lg focus-ring touch-target cursor-pointer"
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
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-gray-900 border-l border-gray-700 z-40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${
          /* Responsive width */
          "w-full max-w-sm md:w-96"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-white transition-colors focus-ring touch-target cursor-pointer"
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* User Authentication Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Account</h3>

            {!user ? (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">
                  Sign in to sync your data across devices and enable chat
                </p>
                <button
                  onClick={handleSignIn}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              </div>
            ) : needsOnboarding || showOnboarding ? (
              /* Onboarding Form for incomplete profiles */
              <div>
                <h4 className="text-white font-medium text-sm mb-3">
                  Complete Your Profile
                </h4>
                <form onSubmit={handleCompleteProfile} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Username (for chat)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      required
                      disabled={isVerifying}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      LeetCode Username
                    </label>
                    <input
                      type="text"
                      value={leetcodeId}
                      onChange={(e) => setLeetcodeId(e.target.value)}
                      placeholder="Your LeetCode username"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      required
                      disabled={isVerifying}
                    />
                    {error && (
                      <p className="mt-1 text-xs text-red-400">{error}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isVerifying || !username.trim() || !leetcodeId.trim()
                    }
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isVerifying ? "Saving..." : "Complete Setup"}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.email ? user.email[0].toUpperCase() : "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {user.username || user.displayName || "User"}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {user.email || "Anonymous"}
                    </p>
                  </div>
                </div>

                {!user && (
                  <button
                    onClick={signInWithGoogle}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm mb-2 cursor-pointer"
                  >
                    Sign in with Google
                  </button>
                )}

                <button
                  onClick={signOut}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors text-sm cursor-pointer"
                >
                  {user ? "Sign Out" : "Continue as Guest"}
                </button>
              </div>
            )}
          </div>

          {/* LeetCode ID Section - Always visible */}
          {user ? (
            <LeetCodeIdManager userLeetcodeId={userLeetcodeId} />
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Your LeetCode ID
              </h3>
              <div className="text-white">
                {displayLeetCodeId ? (
                  <span className="text-sm">{displayLeetCodeId}</span>
                ) : (
                  <span className="text-sm text-gray-400 italic">Not set</span>
                )}
              </div>
            </div>
          )}

          {/* Filter Settings */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Recent Solves Filter
            </h3>
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => onFilterModeChange("24hours")}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                  filterMode === "24hours"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Last 24h
              </button>
              <button
                onClick={() => onFilterModeChange("today")}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                  filterMode === "today"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Today
              </button>
            </div>
          </div>

          {/* Recent Solves - Embedded directly */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
            <RecentSolvesBox
              usernames={usernames}
              statsMap={statsMap}
              filterMode={filterMode}
              refreshTrigger={refreshTrigger}
              compactMode={true}
            />
          </div>

          {/* Question of the Day - Embedded directly */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
            <QuestionOfTheDayBox
              usernames={usernames}
              refreshTrigger={refreshTrigger}
              compactMode={true}
            />
          </div>

          {/* App Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">About</h3>
            <p className="text-gray-400 text-xs mb-3">
              LeetCode Stalker helps you track your friends' coding progress and
              stay motivated together.
            </p>
            <a
              href="https://github.com/Om-Jadon/leetcode-stalker"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
      </div>
    </>
  );
}
