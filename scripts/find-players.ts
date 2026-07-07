import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🔍 Searching for USA and Belgium players...\n");

  try {
    // Get USA and Belgium teams
    const usaTeam = await prisma.team.findFirst({
      where: {
        name: {
          in: ["United States", "USA"],
        },
      },
    });

    const belgiumTeam = await prisma.team.findFirst({
      where: { name: "Belgium" },
    });

    if (!usaTeam) {
      console.log("❌ USA team not found");
      return;
    }

    if (!belgiumTeam) {
      console.log("❌ Belgium team not found");
      return;
    }

    // Search for Mali/Malik players in USA
    console.log("🇺🇸 USA Players (containing 'Mali' or 'Malik'):");
    const maliPlayers = await prisma.player.findMany({
      where: {
        teamId: usaTeam.id,
        name: {
          contains: "Mali",
        },
      },
      select: { id: true, name: true, position: true, jerseyNumber: true },
    });

    if (maliPlayers.length > 0) {
      maliPlayers.forEach((p) => {
        console.log(`   ✅ ${p.name} (${p.position}, #${p.jerseyNumber})`);
      });
    } else {
      console.log("   ❌ No similar players found");
    }

    // Search for Hans/Ankanen players in Belgium
    console.log("\n🇧🇪 Belgium Players (containing 'Hans', 'Anka', or 'Ankanen'):");
    const hansPlayers = await prisma.player.findMany({
      where: {
        teamId: belgiumTeam.id,
        OR: [
          { name: { contains: "Hans" } },
          { name: { contains: "Anka" } },
          { name: { contains: "Ankanen" } },
        ],
      },
      select: { id: true, name: true, position: true, jerseyNumber: true },
    });

    if (hansPlayers.length > 0) {
      hansPlayers.forEach((p) => {
        console.log(`   ✅ ${p.name} (${p.position}, #${p.jerseyNumber})`);
      });
    } else {
      console.log("   ❌ No similar players found");
    }

    // Show all USA and Belgium players for reference
    console.log("\n📋 All USA Players:");
    const allUsaPlayers = await prisma.player.findMany({
      where: { teamId: usaTeam.id },
      select: { id: true, name: true, position: true, jerseyNumber: true },
      orderBy: { name: "asc" },
    });
    allUsaPlayers.forEach((p) => {
      console.log(`   ${p.name} (${p.position}, #${p.jerseyNumber})`);
    });

    console.log("\n📋 All Belgium Players:");
    const allBelgiumPlayers = await prisma.player.findMany({
      where: { teamId: belgiumTeam.id },
      select: { id: true, name: true, position: true, jerseyNumber: true },
      orderBy: { name: "asc" },
    });
    allBelgiumPlayers.forEach((p) => {
      console.log(`   ${p.name} (${p.position}, #${p.jerseyNumber})`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
