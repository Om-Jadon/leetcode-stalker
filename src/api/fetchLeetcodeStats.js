const endpoint = "/graphql";

// Query to fetch daily challenge
const dailyChallengeQuery = `
  query questionOfToday {
    activeDailyCodingChallengeQuestion {
      date
      userStatus
      link
      question {
        acRate
        difficulty
        freqBar
        frontendQuestionId: questionFrontendId
        isFavor
        paidOnly: isPaidOnly
        status
        title
        titleSlug
        hasVideoSolution
        hasSolution
        topicTags {
          name
          id
          slug
        }
      }
    }
  }
`;

// Combined query to fetch user stats, calendar, and recent submissions in one request
const combinedUserQuery = `
  query userStatsAndSubmissions($username: String!, $limit: Int!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      submissionCalendar
    }
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      timestamp
      titleSlug
    }
  }
`;

const statsQuery = `
  query userStats($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      submissionCalendar
    }
  }
`;

const subsQuery = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      timestamp
      titleSlug
    }
  }
`;

const problemDetailsQuery = `
  query questionDetails($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      difficulty
    }
  }
`;

// Query to check if user exists
const userExistsQuery = `
  query checkUserExists($username: String!) {
    matchedUser(username: $username) {
      username
    }
  }
`;

export async function fetchLeetcodeStats(username, filterMode = "24hours") {
  const headers = { "Content-Type": "application/json" };

  // Single combined request for all user data
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: combinedUserQuery,
      variables: { username, limit: 100 },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }

  const data = await response.json();

  const acList = data.data?.matchedUser?.submitStats?.acSubmissionNum || [];
  const easySolved = acList.find((s) => s.difficulty === "Easy")?.count || 0;
  const mediumSolved =
    acList.find((s) => s.difficulty === "Medium")?.count || 0;
  const hardSolved = acList.find((s) => s.difficulty === "Hard")?.count || 0;

  // Get submission calendar for complete history
  const submissionCalendar = data.data?.matchedUser?.submissionCalendar;

  const recentSubs = data.data?.recentAcSubmissionList || [];
  const nowUnix = Date.now() / 1000;

  // Always fetch last 24 hours first
  const last24hSubs = recentSubs.filter(
    (sub) => nowUnix - sub.timestamp <= 86400
  );

  // Then filter based on mode
  let filteredSubs;
  if (filterMode === "today") {
    // Filter for today after 12 AM from the 24h data
    const today = new Date();
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    const todayMidnightUnix = todayMidnight.getTime() / 1000;
    filteredSubs = last24hSubs.filter(
      (sub) => sub.timestamp >= todayMidnightUnix
    );
  } else {
    // Default: use all 24 hours data
    filteredSubs = last24hSubs;
  }

  // Create a map to get the latest timestamp for each unique problem
  const problemMap = new Map();
  filteredSubs.forEach((sub) => {
    const existing = problemMap.get(sub.title);
    if (!existing || sub.timestamp > existing.timestamp) {
      problemMap.set(sub.title, {
        title: sub.title,
        timestamp: sub.timestamp,
        titleSlug: sub.titleSlug,
      });
    }
  });

  // Get difficulties for recent problems
  const recentProblemsArray = Array.from(problemMap.values());
  const problemsWithDifficulty = await Promise.all(
    recentProblemsArray.map(async (problem) => {
      try {
        const difficultyRes = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: problemDetailsQuery,
            variables: { titleSlug: problem.titleSlug },
          }),
        });

        if (difficultyRes.ok) {
          const difficultyData = await difficultyRes.json();
          const difficulty =
            difficultyData.data?.question?.difficulty || "Unknown";
          return {
            ...problem,
            difficulty,
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch difficulty for ${problem.title}:`, error);
      }

      // Fallback if difficulty fetch fails
      return {
        ...problem,
        difficulty: "Unknown",
      };
    })
  );

  // Sort by timestamp (newest first)
  const recentProblemsWithTime = problemsWithDifficulty.sort(
    (a, b) => b.timestamp - a.timestamp
  );

  // Calculate longest streak from submission calendar (has all history)
  const longestStreak = calculateLongestStreak(submissionCalendar);

  return {
    easySolved,
    mediumSolved,
    hardSolved,
    totalSolved: easySolved + mediumSolved + hardSolved,
    recentSolved: problemMap.size,
    recentProblems: recentProblemsWithTime, // All 24h problems
    recentProblemsForDisplay: recentProblemsWithTime.slice(0, 3), // First 3 for card display
    longestStreak,
  };
}

// Helper function to calculate longest streak from submission calendar
function calculateLongestStreak(submissionCalendar) {
  if (!submissionCalendar) {
    return 0;
  }

  // Parse the submission calendar JSON
  let calendarData;
  try {
    calendarData = JSON.parse(submissionCalendar);
  } catch (e) {
    console.error("Failed to parse submission calendar:", e);
    return 0;
  }

  // Get all days with at least one submission
  const days = Object.keys(calendarData)
    .filter((timestamp) => parseInt(calendarData[timestamp]) > 0)
    .map((timestamp) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    });

  // Remove duplicates and sort
  const uniqueDays = [...new Set(days)].sort();

  if (uniqueDays.length === 0) {
    return 0;
  }

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prevDate = new Date(uniqueDays[i - 1] + "T00:00:00");
    const currDate = new Date(uniqueDays[i] + "T00:00:00");

    const diffTime = currDate - prevDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

// Helper function to get midnight UTC timestamp
function getNextMidnightUTC() {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return midnight.getTime();
}

// Function to fetch daily challenge question with caching
export async function fetchDailyChallenge() {
  const CACHE_KEY = "leetcode_daily_challenge";

  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, expiresAt } = JSON.parse(cached);
      if (Date.now() < expiresAt) {
        console.log("Using cached daily challenge");
        return data;
      }
    }
  } catch (e) {
    console.warn("Failed to read daily challenge cache:", e);
  }

  // Fetch from API if no valid cache
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: dailyChallengeQuery }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch daily challenge");
    }

    const responseData = await response.json();
    const challenge = responseData.data?.activeDailyCodingChallengeQuestion;

    if (!challenge) {
      throw new Error("No daily challenge found");
    }

    const dailyChallengeData = {
      date: challenge.date,
      question: {
        title: challenge.question.title,
        titleSlug: challenge.question.titleSlug,
        difficulty: challenge.question.difficulty,
        frontendQuestionId: challenge.question.frontendQuestionId,
        acRate: challenge.question.acRate,
        topicTags: challenge.question.topicTags || [],
        paidOnly: challenge.question.paidOnly,
      },
      link: challenge.link,
    };

    // Cache until midnight UTC
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: dailyChallengeData,
          expiresAt: getNextMidnightUTC(),
        })
      );
    } catch (e) {
      console.warn("Failed to cache daily challenge:", e);
    }

    return dailyChallengeData;
  } catch (error) {
    console.error("Error fetching daily challenge:", error);
    throw error;
  }
}

// Function to check if a user has solved a specific problem
export async function checkUserSolvedProblem(username, titleSlug) {
  const headers = { "Content-Type": "application/json" };

  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        titleSlug
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables: { username, limit: 200 }, // Check more submissions to be thorough
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const submissions = data.data?.recentAcSubmissionList || [];

    return submissions.some((sub) => sub.titleSlug === titleSlug);
  } catch (error) {
    console.error(`Error checking if ${username} solved ${titleSlug}:`, error);
    return false;
  }
}

// Function to check if a LeetCode user exists
export async function checkUserExists(username) {
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: userExistsQuery,
        variables: { username },
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // If matchedUser is null, the user doesn't exist
    return data.data?.matchedUser !== null;
  } catch (error) {
    console.error(`Error checking if user ${username} exists:`, error);
    return false;
  }
}
