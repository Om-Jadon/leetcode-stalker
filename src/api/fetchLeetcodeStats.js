const endpoint = "/graphql";

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
  const uniqueRecent = [...new Set(inLast24h.map((sub) => sub.title))];

  return {
    easySolved,
    mediumSolved,
    hardSolved,
    totalSolved: easySolved + mediumSolved + hardSolved,
    recentSolved: uniqueRecent.length,
    recentProblems: uniqueRecent.slice(0, 5),
  };
}
