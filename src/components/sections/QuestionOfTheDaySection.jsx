import React, { useState, useEffect } from "react";
import {
  fetchDailyChallenge,
  checkUserSolvedProblem,
} from "../../api/fetchLeetcodeStats";

// Helper function to get difficulty colors
const getDifficultyColors = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return {
        bg: "bg-green-900/30",
        border: "border-green-700",
        text: "text-green-300",
        badge: "bg-green-800 text-green-200",
      };
    case "medium":
      return {
        bg: "bg-yellow-900/30",
        border: "border-yellow-700",
        text: "text-yellow-300",
        badge: "bg-yellow-800 text-yellow-200",
      };
    case "hard":
      return {
        bg: "bg-red-900/30",
        border: "border-red-700",
        text: "text-red-300",
        badge: "bg-red-800 text-red-200",
      };
    default:
      return {
        bg: "bg-slate-700",
        border: "border-slate-600",
        text: "text-slate-300",
        badge: "bg-slate-600 text-slate-300",
      };
  }
};

export default function QuestionOfTheDaySection({ usernames, refreshTrigger }) {
  // State for QOTD
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [userSolveStatus, setUserSolveStatus] = useState({});
  const [isLoadingQOTD, setIsLoadingQOTD] = useState(true);
  const [qotdError, setQotdError] = useState(null);

  // Fetch daily challenge and check user solve status
  useEffect(() => {
    const loadDailyChallenge = async () => {
      try {
        setIsLoadingQOTD(true);
        setQotdError(null);

        const challenge = await fetchDailyChallenge();
        setDailyChallenge(challenge);

        // Check solve status for each user
        const solvePromises = usernames.map(async (username) => {
          try {
            const solved = await checkUserSolvedProblem(
              username,
              challenge.question.titleSlug
            );
            return [username, solved];
          } catch (error) {
            console.error(
              `Error checking solve status for ${username}:`,
              error
            );
            return [username, false];
          }
        });

        const results = await Promise.all(solvePromises);
        const statusMap = Object.fromEntries(results);
        setUserSolveStatus(statusMap);
      } catch (error) {
        console.error("Error loading daily challenge:", error);
        setQotdError("Failed to load daily challenge");
      } finally {
        setIsLoadingQOTD(false);
      }
    };

    loadDailyChallenge();
  }, [usernames, refreshTrigger]);

  if (!dailyChallenge) {
    return (
      <div className="h-full">
        {isLoadingQOTD ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        ) : qotdError ? (
          <p className="text-red-400 text-sm text-center py-4">{qotdError}</p>
        ) : (
          <p className="text-slate-400 text-sm text-center py-4">
            No daily challenge found
          </p>
        )}
      </div>
    );
  }

  const colors = getDifficultyColors(dailyChallenge.question.difficulty);
  const solvedUsers = Object.entries(userSolveStatus).filter(
    ([, solved]) => solved
  );
  const unsolvedUsers = Object.entries(userSolveStatus).filter(
    ([, solved]) => !solved
  );

  return (
    <div className="h-full space-y-4">
      {/* Daily Challenge Content */}
      <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="text-white font-medium text-sm leading-tight flex-1">
            {dailyChallenge.question.title}
          </h4>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${colors.badge} shrink-0`}
          >
            {dailyChallenge.question.difficulty}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300 text-xs">
            Problem #{dailyChallenge.question.frontendQuestionId}
          </span>
          {dailyChallenge.link && (
            <a
              href={dailyChallenge.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
            >
              View Problem →
            </a>
          )}
        </div>

        <div className="text-slate-400 text-xs leading-relaxed">
          {dailyChallenge.question.content ? (
            <div
              dangerouslySetInnerHTML={{
                __html:
                  dailyChallenge.question.content.substring(0, 200) + "...",
              }}
            />
          ) : (
            "No description available"
          )}
        </div>
      </div>

      {/* User Solve Status */}
      {usernames.length > 0 && (
        <div className="space-y-3">
          {solvedUsers.length > 0 && (
            <div>
              <h5 className="text-green-400 text-xs font-medium mb-2 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Solved ({solvedUsers.length})
              </h5>
              <div className="flex flex-wrap gap-1">
                {solvedUsers.map(([username]) => (
                  <span
                    key={username}
                    className="px-2 py-1 bg-green-900/30 border border-green-700 text-green-300 rounded text-xs"
                  >
                    {username}
                  </span>
                ))}
              </div>
            </div>
          )}

          {unsolvedUsers.length > 0 && (
            <div>
              <h5 className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Not Solved ({unsolvedUsers.length})
              </h5>
              <div className="flex flex-wrap gap-1">
                {unsolvedUsers.map(([username]) => (
                  <span
                    key={username}
                    className="px-2 py-1 bg-red-900/30 border border-red-700 text-red-300 rounded text-xs"
                  >
                    {username}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
