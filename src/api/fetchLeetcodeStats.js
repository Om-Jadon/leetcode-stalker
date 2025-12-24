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

const statsQuery = `
  query userStats($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
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

  const [statsRes, subsRes] = await Promise.all([
    fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: statsQuery, variables: { username } }),
    }),
    fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: subsQuery,
        variables: { username, limit: 100 },
      }),
    }),
  ]);

  if (!statsRes.ok || !subsRes.ok) {
    throw new Error("Failed to fetch stats");
  }

  const statsData = await statsRes.json();
  const subsData = await subsRes.json();

  const acList =
    statsData.data?.matchedUser?.submitStats?.acSubmissionNum || [];
  const easySolved = acList.find((s) => s.difficulty === "Easy")?.count || 0;
  const mediumSolved =
    acList.find((s) => s.difficulty === "Medium")?.count || 0;
  const hardSolved = acList.find((s) => s.difficulty === "Hard")?.count || 0;

  const recentSubs = subsData.data?.recentAcSubmissionList || [];
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

  return {
    easySolved,
    mediumSolved,
    hardSolved,
    totalSolved: easySolved + mediumSolved + hardSolved,
    recentSolved: problemMap.size,
    recentProblems: recentProblemsWithTime, // All 24h problems
    recentProblemsForDisplay: recentProblemsWithTime.slice(0, 3), // First 3 for card display
  };
}

// Function to fetch daily challenge question
export async function fetchDailyChallenge() {
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

    const data = await response.json();
    const challenge = data.data?.activeDailyCodingChallengeQuestion;

    if (!challenge) {
      throw new Error("No daily challenge found");
    }

    return {
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
