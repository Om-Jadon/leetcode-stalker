import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ProfileSkeleton, SidebarSkeleton } from "../LoadingSkeleton";

export default function ProfileSection({
  filterMode,
  onFilterModeChange,
  onOpenProfileSetup,
  authLoading,
}) {
  const {
    user,
    signOut,
    signInWithGoogle,
    hasCompleteProfile,
    updateLeetcodeId,
  } = useAuth();

  // LeetCode ID editing state
  const [isEditingLeetCode, setIsEditingLeetCode] = useState(false);
  const [newLeetCodeId, setNewLeetCodeId] = useState("");
  const [isUpdatingLeetCode, setIsUpdatingLeetCode] = useState(false);

  // Update newLeetCodeId when user changes
  useEffect(() => {
    if (!isEditingLeetCode && user?.leetcodeId) {
      setNewLeetCodeId(user.leetcodeId);
    }
  }, [user?.leetcodeId, isEditingLeetCode]);

  const handleSaveLeetCodeId = async () => {
    if (!newLeetCodeId.trim() || !user) return;

    setIsUpdatingLeetCode(true);
    try {
      await updateLeetcodeId(newLeetCodeId.trim());
      setIsEditingLeetCode(false);
    } catch (error) {
      console.error("Failed to update LeetCode ID:", error);
    } finally {
      setIsUpdatingLeetCode(false);
    }
  };

  const handleCancelLeetCodeEdit = () => {
    setNewLeetCodeId(user?.leetcodeId || "");
    setIsEditingLeetCode(false);
  };

  return (
    <div className="space-y-6">
      {/* User Authentication Section */}
      <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
        <h3 className="text-sm font-medium text-neutral-300 mb-3">Account</h3>
        {authLoading ? (
          <ProfileSkeleton />
        ) : !user ? (
          <div className="text-center space-y-3">
            <svg
              className="w-8 h-8 text-neutral-500 mx-auto"
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
            <div className="text-neutral-400 text-sm mb-3">
              Sign in to save your tracked users and access more features
            </div>
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
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
        ) : !hasCompleteProfile ? (
          <div className="text-center space-y-3">
            <svg
              className="w-8 h-8 text-amber-500 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-white text-sm font-medium mb-1">
                Complete Your Profile
              </p>
              <p className="text-neutral-400 text-xs mb-3">
                Set up your username and LeetCode ID
              </p>
            </div>
            <button
              onClick={onOpenProfileSetup}
              className="bg-amber-600 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer"
            >
              Complete Profile
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user.username?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <div className="text-white font-medium">{user.username}</div>
                <div className="text-xs text-neutral-400">{user.email}</div>
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
      {authLoading ? (
        <SidebarSkeleton />
      ) : (
        user &&
        hasCompleteProfile && (
          <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-neutral-300">
                Your LeetCode ID
              </h3>
              {!isEditingLeetCode && (
                <button
                  onClick={() => setIsEditingLeetCode(true)}
                  className="text-xs text-amber-400 hover:text-orange-300 transition-colors cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingLeetCode ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newLeetCodeId}
                  onChange={(e) => setNewLeetCodeId(e.target.value)}
                  placeholder="Enter your LeetCode username"
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLeetCodeId}
                    disabled={isUpdatingLeetCode || !newLeetCodeId.trim()}
                    className="flex-1 bg-amber-600 hover:bg-orange-600 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                  >
                    {isUpdatingLeetCode ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancelLeetCodeEdit}
                    disabled={isUpdatingLeetCode}
                    className="flex-1 bg-neutral-600 hover:bg-neutral-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-white">
                {user?.leetcodeId ? (
                  <span className="text-sm">{user.leetcodeId}</span>
                ) : (
                  <span className="text-sm text-neutral-400 italic">
                    Not set
                  </span>
                )}
              </div>
            )}
          </div>
        )
      )}

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
        <h3 className="text-sm font-medium text-neutral-300 mb-2">About</h3>
        <p className="text-neutral-400 text-xs mb-3">
          LeetCode Stalker helps you track your friends' coding progress and
          stay motivated together.
        </p>
        <a
          href="https://github.com/Om-Jadon/leetcode-stalker"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-amber-400 hover:text-orange-300 text-xs transition-colors"
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
  );
}
