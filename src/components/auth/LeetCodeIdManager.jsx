import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function LeetCodeIdManager({ userLeetcodeId }) {
  const { user, updateLeetcodeId } = useAuth();

  // Get the display ID from multiple sources
  const displayLeetCodeId =
    user?.leetcodeId ||
    userLeetcodeId ||
    localStorage.getItem("userLeetcodeId");

  const [isEditing, setIsEditing] = useState(false);
  const [newId, setNewId] = useState(displayLeetCodeId || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Update newId when displayLeetCodeId changes
  useEffect(() => {
    if (!isEditing) {
      setNewId(displayLeetCodeId || "");
    }
  }, [displayLeetCodeId, isEditing]);

  const handleSave = async () => {
    if (!newId.trim()) return;

    setIsUpdating(true);
    try {
      // Always update localStorage for consistency
      localStorage.setItem("userLeetcodeId", newId.trim());

      // If user is authenticated, also update Firebase
      if (user) {
        await updateLeetcodeId(newId.trim());
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update LeetCode ID:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setNewId(displayLeetCodeId || "");
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-neutral-300">
          Your LeetCode ID
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-amber-400 hover:text-orange-300 transition-colors cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="Enter your LeetCode username"
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isUpdating || !newId.trim()}
              className="flex-1 bg-amber-600 hover:bg-orange-600 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="flex-1 bg-neutral-600 hover:bg-neutral-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-white">
          {displayLeetCodeId ? (
            <span className="text-sm">{displayLeetCodeId}</span>
          ) : (
            <span className="text-sm text-neutral-400 italic">Not set</span>
          )}
        </div>
      )}
    </div>
  );
}
