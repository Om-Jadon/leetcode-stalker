// FriendCard.jsx
import React from "react";

export default function FriendCard({ user, stats, onRemove }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative group">
      <button
        onClick={onRemove}
        className="absolute top-4 cursor-pointer right-4 p-1 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Remove user"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
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

      <div className="p-6">
        <div className="flex items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user}</h2>
            <a
              href={`https://leetcode.com/${user}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline"
            >
              View Profile
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          <div className="py-3 px-2 bg-green-50 rounded-lg border border-green-100">
            <div className="text-xs text-green-600 uppercase font-semibold tracking-wide mb-1">
              Easy
            </div>
            <div className="text-xl font-bold text-green-700">
              {stats.easySolved || 0}
            </div>
          </div>
          <div className="py-3 px-2 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="text-xs text-yellow-600 uppercase font-semibold tracking-wide mb-1">
              Medium
            </div>
            <div className="text-xl font-bold text-yellow-700">
              {stats.mediumSolved || 0}
            </div>
          </div>
          <div className="py-3 px-2 bg-red-50 rounded-lg border border-red-100">
            <div className="text-xs text-red-600 uppercase font-semibold tracking-wide mb-1">
              Hard
            </div>
            <div className="text-xl font-bold text-red-700">
              {stats.hardSolved || 0}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              Total Solved
            </span>
            <span className="font-bold text-gray-900">
              {stats.totalSolved || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              Recent Activity
            </span>
            <span className="font-semibold text-blue-600">
              {stats.recentSolved || 0} today
            </span>
          </div>
        </div>

        {stats.recentProblems?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Recently Solved
            </h3>
            <ul className="space-y-2">
              {stats.recentProblems.slice(0, 3).map((title, i) => (
                <li
                  key={i}
                  className="text-xs p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-150 text-gray-700 truncate"
                >
                  {title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
