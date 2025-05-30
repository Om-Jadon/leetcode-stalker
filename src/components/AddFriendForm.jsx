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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all duration-200">
        <div className="flex items-center gap-3 flex-1">
          <svg
            className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0"
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
            className="flex-grow border-0 focus:ring-0 p-0 text-white placeholder-gray-400 bg-transparent text-sm sm:text-base"
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={!username.trim() || isSubmitting}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base ${
            !username.trim() || isSubmitting
              ? "bg-gray-600 cursor-not-allowed text-gray-400"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          } shadow-sm transition-colors duration-150 flex-shrink-0`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-current"
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
              Adding...
            </div>
          ) : (
            "Add"
          )}
        </button>
      </div>
    </form>
  );
}
