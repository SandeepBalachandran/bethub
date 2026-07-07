import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🔄 Updating USA vs Belgium scorers...\n");

  try {
    // Find USA vs Belgium match
    let match = await prisma.match.findFirst({
      where: {
        homeTeam: { name: { contains: "United States" } },
        awayTeam: { name: { contains: "Belgium" } },
      },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          homeTeam: { name: { contains: "Belgium" } },
          awayTeam: { name: { contains: "United States" } },
        },
        include: { homeTeam: true, awayTeam: true },
      });
    }

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          homeTeam: { name: { contains: "USA" } },
          awayTeam: { name: { contains: "Belgium" } },
        },
        include: { homeTeam: true, awayTeam: true },
      });
    }

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          homeTeam: { name: { contains: "Belgium" } },
          awayTeam: { name: { contains: "USA" } },
        },
        include: { homeTeam: true, awayTeam: true },
      });
    }

    if (!match) {
      console.log("❌ USA vs Belgium match not found");
      process.exit(1);
    }

    const usaTeam =
      match.homeTeam.name.includes("United States") ||
      match.homeTeam.name.includes("USA")
        ? match.homeTeam
        : match.awayTeam;
    const belgiumTeam =
      match.homeTeam.name.includes("Belgium") ? match.homeTeam : match.awayTeam;

    console.log(`Found match: ${usaTeam.name} vs ${belgiumTeam.name}\n`);

    // Add the two missing scorers
    const scorerData = [
      { name: "Malik Tillman", teamId: usaTeam.id },
      { name: "Hans Vanaken", teamId: belgiumTeam.id },
    ];

    for (const scorer of scorerData) {
      const player = await prisma.player.findFirst({
        where: {
          name: scorer.name,
          team: { id: scorer.teamId },
        },
      });

      if (player) {
        await prisma.matchScorer.create({
          data: { matchId: match.id, playerId: player.id },
        });
        console.log(`✅ ${scorer.name} (${player.position}, #${player.jerseyNumber})`);
      } else {
        console.log(`❌ ${scorer.name} - NOT FOUND`);
      }
    }

    // Show all scorers for this match
    console.log("\n📊 All scorers for USA vs Belgium:");
    const allScorers = await prisma.matchScorer.findMany({
      where: { matchId: match.id },
      include: { player: { include: { team: true } } },
    });

    allScorers.forEach((scorer) => {
      console.log(
        `   • ${scorer.player.name} (${scorer.player.team.name})`
      );
    });

    console.log("\n✅ USA vs Belgium scorers updated!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
