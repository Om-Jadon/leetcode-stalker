import React, { useState } from "react";
import Modal from "../Modal";
import { useAuth } from "../../contexts/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const { signInWithGoogle, createUserProfile } = useAuth();
  const [step, setStep] = useState("profile"); // "profile" or "signin"
  const [username, setUsername] = useState("");
  const [leetcodeId, setLeetcodeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!leetcodeId.trim()) {
      setError("LeetCode ID is required");
      return;
    }
    setError("");
    setStep("signin");
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithGoogle();

      if (result) {
        // Create the user profile with the entered username and leetcode ID
        await createUserProfile(username.trim(), leetcodeId.trim());
        onClose();
        // Reset form
        setStep("profile");
        setUsername("");
        setLeetcodeId("");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      if (error.message.includes("Username is already taken")) {
        setError("Username is already taken. Please choose another one.");
        setStep("profile"); // Go back to profile step to change username
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("profile");
    setError("");
  };

  const handleClose = () => {
    onClose();
    // Reset form after a small delay to avoid visual glitch
    setTimeout(() => {
      setStep("profile");
      setUsername("");
      setLeetcodeId("");
      setError("");
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sign In">
      <div className="space-y-6">
        {step === "profile" ? (
          <>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Create Your Profile
              </h3>
              <p className="text-sm text-neutral-400">
                Set up your unique username and LeetCode ID to get started
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter a unique username"
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-neutral-400 mt-1">
                  This will be your identity for chatting with friends
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  LeetCode ID *
                </label>
                <input
                  type="text"
                  value={leetcodeId}
                  onChange={(e) => setLeetcodeId(e.target.value)}
                  placeholder="Enter your LeetCode username"
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Your LeetCode profile username
                </p>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition-colors cursor-pointer"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Almost Done!
              </h3>
              <p className="text-sm text-neutral-400 mb-4">
                Sign in with Google to complete your account setup
              </p>

              <div className="bg-neutral-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Username:</span>
                  <span className="text-white font-medium">{username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">LeetCode ID:</span>
                  <span className="text-white font-medium">{leetcodeId}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md p-3">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-900 py-2 px-4 rounded-md font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </button>

              <button
                onClick={handleBack}
                disabled={isLoading}
                className="w-full bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-500 text-white py-2 px-4 rounded-md font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Back to Edit Profile
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
