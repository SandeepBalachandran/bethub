import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🔄 Updating match scorers...\n");

  try {
    // 1. Mexico vs England - England won
    console.log("1️⃣  Mexico vs England");
    let match = await prisma.match.findFirst({
      where: {
        homeTeam: { name: { contains: "Mexico" } },
        awayTeam: { name: { contains: "England" } },
      },
      include: { homeTeam: true, awayTeam: true, winnerTeam: true },
    });

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          homeTeam: { name: { contains: "England" } },
          awayTeam: { name: { contains: "Mexico" } },
        },
        include: { homeTeam: true, awayTeam: true, winnerTeam: true },
      });
    }

    if (match) {
      const englandTeam =
        match.homeTeam.name.includes("England") ? match.homeTeam : match.awayTeam;
      const mexicoTeam =
        match.homeTeam.name.includes("Mexico") ? match.homeTeam : match.awayTeam;

      // Set winner to England
      await prisma.match.update({
        where: { id: match.id },
        data: { winnerTeamId: englandTeam.id },
      });

      // Clear existing scorers
      await prisma.matchScorer.deleteMany({ where: { matchId: match.id } });

      // Add new scorers
      const scorerData = [
        { name: "Julián Quiñones", teamId: mexicoTeam.id },
        { name: "Raúl Jiménez", teamId: mexicoTeam.id },
        { name: "Jude Bellingham", teamId: englandTeam.id, goals: 2 },
        { name: "Harry Kane", teamId: englandTeam.id },
      ];

      for (const scorer of scorerData) {
        const player = await prisma.player.findFirst({
          where: {
            name: { contains: scorer.name },
            team: { id: scorer.teamId },
          },
        });

        if (player) {
          const goals = scorer.goals || 1;
          for (let i = 0; i < goals; i++) {
            await prisma.matchScorer.create({
              data: { matchId: match.id, playerId: player.id },
            });
          }
          console.log(`   ✅ ${scorer.name} (${goals} goal${goals > 1 ? "s" : ""})`);
        } else {
          console.log(`   ⚠️  ${scorer.name} - NOT FOUND`);
        }
      }
    } else {
      console.log("   ❌ Match not found\n");
    }

    // 2. Portugal vs Spain
    console.log("\n2️⃣  Portugal vs Spain");
    match = await prisma.match.findFirst({
      where: {
        homeTeam: { name: { contains: "Portugal" } },
        awayTeam: { name: { contains: "Spain" } },
      },
      include: { homeTeam: true, awayTeam: true, winnerTeam: true },
    });

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          homeTeam: { name: { contains: "Spain" } },
          awayTeam: { name: { contains: "Portugal" } },
        },
        include: { homeTeam: true, awayTeam: true, winnerTeam: true },
      });
    }

    if (match) {
      const spainTeam =
        match.homeTeam.name.includes("Spain") ? match.homeTeam : match.awayTeam;

      // Set winner to Spain
      await prisma.match.update({
        where: { id: match.id },
        data: { winnerTeamId: spainTeam.id },
      });

      // Clear existing scorers
      await prisma.matchScorer.deleteMany({ where: { matchId: match.id } });

      // Add new scorers
      const player = await prisma.player.findFirst({
        where: {
          name: { contains: "Mikel Merino" },
          team: { id: spainTeam.id },
        },
      });

      if (player) {
        await prisma.matchScorer.create({
          data: { matchId: match.id, playerId: player.id },
        });
        console.log(`   ✅ Mikel Merino`);
      } else {
        console.log(`   ⚠️  Mikel Merino - NOT FOUND`);
      }
    } else {
      console.log("   ❌ Match not found\n");
    }

    // 3. USA vs Belgium
    console.log("\n3️⃣  USA vs Belgium");
    match = await prisma.match.findFirst({
      where: {
        homeTeam: { name: { contains: "United States" } },
        awayTeam: { name: { contains: "Belgium" } },
      },
      include: { homeTeam: true, awayTeam: true, winnerTeam: true },
    });

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          homeTeam: { name: { contains: "Belgium" } },
          awayTeam: { name: { contains: "United States" } },
        },
        include: { homeTeam: true, awayTeam: true, winnerTeam: true },
      });
    }

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          homeTeam: { name: { contains: "USA" } },
          awayTeam: { name: { contains: "Belgium" } },
        },
        include: { homeTeam: true, awayTeam: true, winnerTeam: true },
      });
    }

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          homeTeam: { name: { contains: "Belgium" } },
          awayTeam: { name: { contains: "USA" } },
        },
        include: { homeTeam: true, awayTeam: true, winnerTeam: true },
      });
    }

    if (match) {
      const usaTeam =
        match.homeTeam.name.includes("United States") ||
        match.homeTeam.name.includes("USA")
          ? match.homeTeam
          : match.awayTeam;
      const belgiumTeam =
        match.homeTeam.name.includes("Belgium") ? match.homeTeam : match.awayTeam;

      // Set winner to Belgium
      await prisma.match.update({
        where: { id: match.id },
        data: { winnerTeamId: belgiumTeam.id },
      });

      // Clear existing scorers
      await prisma.matchScorer.deleteMany({ where: { matchId: match.id } });

      // Add new scorers
      const scorerData = [
        { name: "Mali Tillman", teamId: usaTeam.id },
        { name: "Charles De Ketelaere", teamId: belgiumTeam.id },
        { name: "Hans Ankanen", teamId: belgiumTeam.id },
        { name: "Romelu Lukaku", teamId: belgiumTeam.id },
      ];

      for (const scorer of scorerData) {
        const player = await prisma.player.findFirst({
          where: {
            name: { contains: scorer.name },
            team: { id: scorer.teamId },
          },
        });

        if (player) {
          await prisma.matchScorer.create({
            data: { matchId: match.id, playerId: player.id },
          });
          console.log(`   ✅ ${scorer.name}`);
        } else {
          console.log(`   ⚠️  ${scorer.name} - NOT FOUND`);
        }
      }
    } else {
      console.log("   ❌ Match not found\n");
    }

    console.log("\n✅ All updates completed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
