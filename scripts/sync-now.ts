import { prisma } from "@/lib/prisma";
import { syncLiveMatchResults } from "@/lib/sync-matches";

async function main() {
  console.log("🔄 Starting live match results sync...");
  const startTime = Date.now();

  try {
    await syncLiveMatchResults(prisma);

    const duration = Date.now() - startTime;
    console.log(`✅ Sync completed in ${duration}ms`);

    // Show updated matches
    const matches = await prisma.match.findMany({
      where: { status: { in: ["FINISHED", "LIVE"] } },
      include: {
        homeTeam: true,
        awayTeam: true,
        winnerTeam: true,
        scorers: { include: { player: true } },
      },
      orderBy: { kickoffTime: "desc" },
      take: 5,
    });

    console.log("\n📊 Latest finished/live matches:");
    for (const match of matches) {
      const scorersText = match.scorers
        .map((s) => s.player.name)
        .join(", ") || "None";
      console.log(
        `  • ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.status})`
      );
      console.log(
        `    Winner: ${match.winnerTeam?.name || "Not set"} | Scorers: ${scorersText}`
      );
    }
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
