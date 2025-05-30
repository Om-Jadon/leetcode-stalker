const endpoint = "/api/graphql";

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

export async function fetchLeetcodeStats(username) {
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
  const inLast24h = recentSubs.filter(
    (sub) => nowUnix - sub.timestamp <= 86400
  );

  // Create a map to get the latest timestamp for each unique problem
  const problemMap = new Map();
  inLast24h.forEach((sub) => {
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
