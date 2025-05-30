// AddFriendForm.jsx
import { useState } from "react";

export default function AddFriendForm({ addFriend }) {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsSubmitting(true);
      try {
        await addFriend(username.trim());
        setUsername("");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all duration-200">
        <svg
          className="h-6 w-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter LeetCode username"
          className="flex-grow border-0 focus:ring-0 p-0 text-gray-900 placeholder-gray-400"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!username.trim() || isSubmitting}
          className={`px-5 py-2.5 rounded-lg font-medium ${
            !username.trim() || isSubmitting
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          } text-white shadow-sm transition-colors duration-150`}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
