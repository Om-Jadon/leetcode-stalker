// App.jsx
import React, { useEffect, useState, useCallback } from "react";
import FriendCard from "./components/FriendCard";
import AddFriendForm from "./components/AddFriendForm";
import Notification from "./components/Notification";
import LeftSidebar from "./components/LeftSidebar";
import RightSidebar from "./components/RightSidebar";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { fetchLeetcodeStats, checkUserExists } from "./api/fetchLeetcodeStats";
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  const {
    user,
    trackedUsers,
    addFriend: addTrackedUser,
    removeFriend: removeTrackedUser,
    loading: authLoading,
  } = useAuth();

  // UI State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [rightSidebarMode, setRightSidebarMode] = useState("profile"); // "profile", "recent-solves", "qotd"
  const [showProfileSetupModal, setShowProfileSetupModal] = useState(false);

  // Friends and stats data
  const [usernames, setUsernames] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(new Set());
  const [errorUsers, setErrorUsers] = useState(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  const [filterMode, setFilterMode] = useState(
    () => localStorage.getItem("recentSolvesFilterMode") || "24hours"
  );
  const [notification, setNotification] = useState(null);
  const [nextRefreshTime, setNextRefreshTime] = useState(null);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(null);

  // Handle filter mode change
  const handleFilterModeChange = (newMode) => {
    setFilterMode(newMode);
    localStorage.setItem("recentSolvesFilterMode", newMode);
    // Trigger a refresh to update the data with new filter
    reloadAll();
  };

  // Helper function to add user to list (either own ID or tracked user)
  const addUserToList = async (username) => {
    try {
      if (user) {
        // If authenticated, use Firebase context (which also updates localStorage)
        await addTrackedUser(username);
      } else {
        // If guest, use localStorage only
        const currentUsers = JSON.parse(
          localStorage.getItem("leetcodeUsers") || "[]"
        );
        if (!currentUsers.includes(username)) {
          const updated = [...currentUsers, username];
          localStorage.setItem("leetcodeUsers", JSON.stringify(updated));
          // Trigger custom event to update state
          window.dispatchEvent(new CustomEvent("trackedUsersChanged"));
        }
      }
    } catch (error) {
      console.error("Error adding user to list:", error);
      // Fallback to localStorage for any errors
      const currentUsers = JSON.parse(
        localStorage.getItem("leetcodeUsers") || "[]"
      );
      if (!currentUsers.includes(username)) {
        const updated = [...currentUsers, username];
        localStorage.setItem("leetcodeUsers", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("trackedUsersChanged"));
      }
    }
  };

  // Sync usernames with tracked users and user's own ID
  useEffect(() => {
    let allUsernames = [...trackedUsers];

    // If user is authenticated and has a LeetCode ID, add it to the list
    if (user?.leetcodeId && !allUsernames.includes(user.leetcodeId)) {
      allUsernames = [user.leetcodeId, ...allUsernames];
    } else if (user?.leetcodeId && allUsernames.includes(user.leetcodeId)) {
      // Move user's own ID to the front if it exists
      allUsernames = allUsernames.filter((u) => u !== user.leetcodeId);
      allUsernames = [user.leetcodeId, ...allUsernames];
    }

    setUsernames(allUsernames);
  }, [trackedUsers, user?.leetcodeId]);

  const loadStats = useCallback(
    async (username, mode = filterMode) => {
      try {
        const stats = await fetchLeetcodeStats(username, mode);
        setStatsMap((prev) => ({ ...prev, [username]: stats }));
        setErrorUsers((prev) => {
          const next = new Set(prev);
          next.delete(username);
          return next;
        });
        return stats;
      } catch (err) {
        console.error("Error loading stats for", username, err);
        setErrorUsers((prev) => new Set([...prev, username]));
        throw err; // Re-throw for handling in addUser
      }
    },
    [filterMode]
  );

  const reloadAll = useCallback(async () => {
    // Trigger refresh for Question of the Day and Recent Solves
    setRefreshTrigger(Date.now());

    setIsLoading(true);
    setErrorUsers(new Set());
    // Set loading state for all users during refresh
    setLoadingUsers(new Set(usernames));

    try {
      await Promise.all(
        usernames.map((username) => loadStats(username, filterMode))
      );
    } finally {
      setIsLoading(false);
      // Clear loading state for all users after refresh
      setLoadingUsers(new Set());
      // Set next refresh time (10 minutes from now)
      const nextRefresh = Date.now() + 600000;
      setNextRefreshTime(nextRefresh);
    }
  }, [usernames, filterMode, loadStats]);

  useEffect(() => {
    if (usernames.length > 0) {
      reloadAll();
    }
    const interval = setInterval(() => {
      if (usernames.length > 0) {
        reloadAll();
      }
    }, 600000);
    return () => clearInterval(interval);
  }, [usernames, reloadAll]);

  // Countdown timer effect
  useEffect(() => {
    if (!nextRefreshTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = nextRefreshTime - now;

      if (timeLeft <= 0) {
        setTimeUntilRefresh(null);
        setNextRefreshTime(null);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        setTimeUntilRefresh({ minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRefreshTime]);

  async function addUser(username) {
    if (username && !usernames.includes(username)) {
      // Check if user exists first
      try {
        const userExists = await checkUserExists(username);

        if (!userExists) {
          setNotification({
            type: "error",
            message: `User "${username}" does not exist on LeetCode. Please check the username and try again.`,
          });
          return;
        }
      } catch (checkError) {
        console.error("Error checking user existence:", checkError);
        setNotification({
          type: "error",
          message: `Failed to verify user "${username}". Please try again.`,
        });
        return;
      }

      // Set loading state for this specific user
      setLoadingUsers((prev) => new Set([...prev, username]));

      try {
        // Use the helper function to add user and update state immediately
        await addUserToList(username);

        // Try to load stats, but don't fail the whole operation if this fails
        try {
          await loadStats(username, filterMode);
        } catch (statsError) {
          console.error("Error loading stats for", username, statsError);
          // Stats loading failed, but user was added successfully
        }

        setNotification({
          type: "success",
          message: `Successfully added ${username}!`,
        });
      } catch (error) {
        console.error("Error adding friend:", error);
        setNotification({
          type: "error",
          message: `Failed to add ${username}. Please try again.`,
        });
      } finally {
        setLoadingUsers((prev) => {
          const next = new Set(prev);
          next.delete(username);
          return next;
        });
      }
    } else if (usernames.includes(username)) {
      setNotification({
        type: "warning",
        message: `User "${username}" is already added.`,
      });
    }
  }

  function removeUser(username) {
    // Prevent removing user's own LeetCode ID
    if (username === user?.leetcodeId) {
      setNotification({
        type: "warning",
        message: "You cannot remove your own LeetCode ID from tracking.",
      });
      return;
    }

    try {
      if (user) {
        // If authenticated, use Firebase context
        removeTrackedUser(username);
      } else {
        // If not authenticated, use localStorage directly and trigger event
        const updated = usernames.filter((user) => user !== username);
        setUsernames(updated);
        localStorage.setItem("leetcodeUsers", JSON.stringify(updated));
        // Dispatch custom event to trigger state update in AuthContext
        window.dispatchEvent(new CustomEvent("trackedUsersChanged"));
      }

      // Clean up stats and UI state immediately
      setStatsMap((prev) => {
        const newMap = { ...prev };
        delete newMap[username];
        return newMap;
      });

      // Clean up loading and error states
      setLoadingUsers((prev) => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
      setErrorUsers((prev) => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });

      setNotification({
        type: "success",
        message: `Removed ${username} from tracking.`,
      });
    } catch (error) {
      console.error("Error removing user:", error);
      setNotification({
        type: "error",
        message: `Failed to remove ${username}. Please try again.`,
      });
    }
  }

  async function retryUser(username) {
    setLoadingUsers((prev) => new Set([...prev, username]));
    await loadStats(username, filterMode);
    setLoadingUsers((prev) => {
      const next = new Set(prev);
      next.delete(username);
      return next;
    });
  }

  // Function to open profile setup modal
  const openProfileSetup = () => {
    setShowProfileSetupModal(true);
  };

  // Function to toggle different right sidebar modes
  const toggleRightSidebar = (mode) => {
    if (rightSidebarOpen && rightSidebarMode === mode) {
      // If same mode is open, close the sidebar
      setRightSidebarOpen(false);
    } else {
      // Open sidebar with new mode
      setRightSidebarMode(mode);
      setRightSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-amber-900 to-neutral-900 relative overflow-x-hidden">
      {/* Full Page Loading Screen */}
      {authLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-neutral-900 via-amber-900 to-neutral-900 z-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto">
              <div className="w-16 h-16 border-4 border-amber-200/20 border-t-amber-400 rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                LeetCode Stalker
              </h2>
              <p className="text-neutral-300">Loading your coding journey...</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebars */}
      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onOpenProfileSetup={openProfileSetup}
        authLoading={authLoading}
      />

      {/* Right Sidebar */}
      {!authLoading && (
        <RightSidebar
          isOpen={rightSidebarOpen}
          mode={rightSidebarMode}
          onToggle={(mode) => toggleRightSidebar(mode)}
          onClose={() => setRightSidebarOpen(false)}
          filterMode={filterMode}
          onFilterModeChange={handleFilterModeChange}
          usernames={usernames}
          statsMap={statsMap}
          refreshTrigger={refreshTrigger}
          onOpenProfileSetup={openProfileSetup}
          authLoading={authLoading}
        />
      )}

      {/* Main Content - only show when not loading */}
      {!authLoading && (
        <div
          className={`transition-all duration-300 ${
            leftSidebarOpen ? "md:ml-96" : "ml-0"
          } ${rightSidebarOpen ? "md:mr-96" : "mr-0"} p-4 md:p-6 lg:p-8`}
        >
          {/* Mobile sidebar toggle for left sidebar only */}
          <div className="flex justify-between items-center md:hidden mb-4">
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="p-2 bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-700 hover:bg-neutral-700/50 transition-colors touch-target focus-ring cursor-pointer"
              aria-label="Toggle chat sidebar"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold gradient-text mb-2">
              LeetCode Stalker
            </h1>
            <p className="text-base md:text-lg text-neutral-300 mb-6 lg:mb-8">
              Stalk them up, Bring them down
            </p>

            {/* Search and Reload Section */}
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <AddFriendForm
                  addFriend={addUser}
                  placeholder="Add LeetCode username to track"
                />
              </div>
              <button
                onClick={reloadAll}
                disabled={isLoading || usernames.length === 0}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors btn-hover-scale focus-ring touch-target min-w-[120px] ${
                  isLoading || usernames.length === 0
                    ? "bg-neutral-400 cursor-not-allowed"
                    : "bg-amber-600 hover:bg-orange-600 cursor-pointer"
                } text-white font-medium px-4 py-2.5 rounded-lg shadow-md transition-all`}
                title={
                  timeUntilRefresh
                    ? `Auto-refresh in ${
                        timeUntilRefresh.minutes
                      }:${timeUntilRefresh.seconds.toString().padStart(2, "0")}`
                    : "Refresh All Stats"
                }
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                ) : (
                  <>
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {timeUntilRefresh && (
                      <span className="text-xs">
                        {timeUntilRefresh.minutes}:
                        {timeUntilRefresh.seconds.toString().padStart(2, "0")}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tracked Users Cards Grid */}
          {usernames.length === 0 ? (
            <div className="text-center py-12 md:py-20 glass-morphism rounded-xl mx-2 md:mx-4">
              <div className="max-w-md mx-auto px-4">
                <svg
                  className="mx-auto h-10 w-10 md:h-12 md:w-12 text-neutral-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="text-lg md:text-xl font-medium text-white mb-2">
                  No users tracked yet
                </h3>
                <p className="text-neutral-400 text-sm md:text-base">
                  Add LeetCode usernames to track their progress
                </p>
                {!user && (
                  <p className="mt-3 text-xs md:text-sm text-indigo-400">
                    💡 Sign in to sync your tracked users across all devices
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div
              className="grid gap-4 md:gap-6 px-2 md:px-0 justify-center"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 400px))",
                gridAutoRows: "max-content",
              }}
            >
              {usernames
                .sort((a, b) => {
                  // Always put user's own ID first
                  if (a === user?.leetcodeId) return -1;
                  if (b === user?.leetcodeId) return 1;

                  const statsA = statsMap[a] || {};
                  const statsB = statsMap[b] || {};
                  const recentA = statsA.recentSolved || 0;
                  const recentB = statsB.recentSolved || 0;

                  // Sort by recent activity first (descending), then by username (ascending) for consistent ordering
                  if (recentB !== recentA) {
                    return recentB - recentA;
                  }
                  return a.localeCompare(b);
                })
                .map((username) => (
                  <FriendCard
                    key={username}
                    user={username}
                    stats={statsMap[username] || {}}
                    onRemove={() => removeUser(username)}
                    isLoading={loadingUsers.has(username)}
                    hasError={errorUsers.has(username)}
                    onRetry={() => retryUser(username)}
                    filterMode={filterMode}
                    isOwnCard={username === user?.leetcodeId}
                    showRemoveButton={username !== user?.leetcodeId}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={showProfileSetupModal}
        onClose={() => setShowProfileSetupModal(false)}
      />
    </div>
  );
}
