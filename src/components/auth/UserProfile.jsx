// User profile component for the header
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function UserProfile() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-neutral-700 rounded-full animate-pulse"></div>
        <div className="w-16 h-4 bg-neutral-700 rounded animate-pulse"></div>
      </div>
    );
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-700/50 transition-colors cursor-pointer"
      >
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
          {!user ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          ) : user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"
          )}
        </div>

        {/* User Name */}
        <div className="text-left">
          <div className="text-sm font-medium text-white">
            {!user ? "Guest User" : user?.displayName || user?.email || "User"}
          </div>
          {!user && (
            <div className="text-xs text-neutral-400">Click to sign in</div>
          )}
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
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

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 z-50">
          <div className="p-4 border-b border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {!user ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {!user ? "Guest User" : user?.displayName || "User"}
                </div>
                <div className="text-xs text-gray-400">
                  {!user ? "Local account only" : user?.email}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            {!user ? (
              <>
                <button
                  onClick={handleSignIn}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  <svg
                    className="w-5 h-5 text-red-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>
                <div className="px-3 py-2 text-xs text-gray-400">
                  Sign in to enable chat features and cloud sync
                </div>
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700 mb-2">
                  Signed in with Google
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign out (continue as guest)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
