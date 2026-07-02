import { requireAuth } from "@/lib/authz";
import { getLeaderboard } from "@/lib/leaderboard";

export default async function LeaderboardPage() {
  const user = await requireAuth();
  const leaderboard = await getLeaderboard();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-2">Rank</th>
            <th className="py-2 pr-2">Player</th>
            <th className="py-2 pr-2 text-right">Winner</th>
            <th className="py-2 pr-2 text-right">Scorer</th>
            <th className="py-2 pr-2 text-right">Penalty</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.userId === user.id;
            const penalty = entry.scorerPoints < 0 ? entry.scorerPoints : 0;
            const scorerGains = entry.scorerPoints - penalty;

            return (
              <tr
                key={entry.userId}
                className={`border-b ${isCurrentUser ? "bg-yellow-50 font-medium" : ""}`}
              >
                <td className="py-2 pr-2">{index + 1}</td>
                <td className="py-2 pr-2">
                  {entry.name}
                  {isCurrentUser && <span className="ml-1 text-xs text-gray-500">(you)</span>}
                </td>
                <td className="py-2 pr-2 text-right">{entry.winnerPoints}</td>
                <td className="py-2 pr-2 text-right">{scorerGains}</td>
                <td className="py-2 pr-2 text-right">{penalty}</td>
                <td className="py-2 text-right font-semibold">{entry.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {leaderboard.length === 0 && (
        <p className="text-sm text-gray-500">No users yet.</p>
      )}
    </main>
  );
}
