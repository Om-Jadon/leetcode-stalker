import React, { useState } from "react";
import Modal from "./Modal";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileSetupModal({ isOpen, onClose }) {
  const { createUserProfile, checkUsernameAvailability } = useAuth();
  const [username, setUsername] = useState("");
  const [leetcodeId, setLeetcodeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!leetcodeId.trim()) {
      setError("LeetCode ID is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check if username is available
      const isAvailable = await checkUsernameAvailability(username.trim());
      if (!isAvailable) {
        setError("Username is already taken. Please choose another one.");
        setIsLoading(false);
        return;
      }

      // Create the user profile
      await createUserProfile(username.trim(), leetcodeId.trim());

      // Reset form and close modal
      setUsername("");
      setLeetcodeId("");
      setError("");
      onClose();
    } catch (error) {
      console.error("Failed to create profile:", error);
      setError("Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setUsername("");
      setLeetcodeId("");
      setError("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Your Profile">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Set Up Your Profile
          </h3>
          <p className="text-sm text-slate-400">
            Choose a unique username and enter your LeetCode ID to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a unique username"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 mt-1">
              This will be your identity for chatting with friends
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              LeetCode ID *
            </label>
            <input
              type="text"
              value={leetcodeId}
              onChange={(e) => setLeetcodeId(e.target.value)}
              placeholder="Enter your LeetCode username"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 mt-1">
              Your LeetCode username for tracking progress
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !leetcodeId.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {isLoading ? "Creating..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
