import { requireAuth } from "@/lib/authz";
import { getLeaderboard } from "@/lib/leaderboard";
import { LeaderboardRow } from "@/components/features/leaderboard/LeaderboardRow";

export default async function LeaderboardPage() {
  const user = await requireAuth();
  const leaderboard = await getLeaderboard();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold gradient-text">Leaderboard</h1>

      {leaderboard.length === 0 ? (
        <p className="text-sm text-gray-500">No players yet.</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              rank={index + 1}
              isCurrentUser={entry.userId === user.id}
            />
          ))}
        </div>
      )}
    </main>
  );
}
