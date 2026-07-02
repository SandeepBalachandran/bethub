import "dotenv/config";
import { PrismaClient, Round } from "@prisma/client";
import { fetchCompetitionMatches, type FootballDataTeam } from "@/lib/football-data";

const prisma = new PrismaClient();

const STAGE_TO_ROUND: Record<string, Round> = {
  LAST_16: Round.ROUND_OF_16,
  QUARTER_FINALS: Round.QUARTER_FINALS,
  SEMI_FINALS: Round.SEMI_FINALS,
  FINAL: Round.FINAL,
};

async function upsertTeam(team: FootballDataTeam) {
  return prisma.team.upsert({
    where: { externalId: team.id },
    update: {
      name: team.name,
      shortName: team.shortName,
      fifaCode: team.tla,
      flag: team.crest,
    },
    create: {
      externalId: team.id,
      name: team.name,
      shortName: team.shortName,
      fifaCode: team.tla,
      flag: team.crest,
    },
  });
}

async function main() {
  const competitionCode = process.argv[2] ?? "WC";

  const matches = await fetchCompetitionMatches(competitionCode);
  const knockoutMatches = matches.filter((match) => match.stage in STAGE_TO_ROUND);

  const [determinedMatches, undeterminedMatches] = knockoutMatches.reduce<
    [typeof knockoutMatches, typeof knockoutMatches]
  >(
    ([determined, undetermined], match) => {
      if (match.homeTeam?.id && match.awayTeam?.id) {
        determined.push(match);
      } else {
        undetermined.push(match);
      }
      return [determined, undetermined];
    },
    [[], []]
  );

  console.log(
    `Fetched ${matches.length} total matches, ${knockoutMatches.length} knockout matches for round mapping.`
  );
  if (undeterminedMatches.length > 0) {
    console.log(
      `Skipping ${undeterminedMatches.length} knockout match(es) whose participants aren't determined yet (earlier rounds still in progress).`
    );
  }

  for (const match of determinedMatches) {
    const homeTeam = await upsertTeam(match.homeTeam);
    const awayTeam = await upsertTeam(match.awayTeam);
    const round = STAGE_TO_ROUND[match.stage];

    await prisma.match.upsert({
      where: { externalId: match.id },
      update: {
        round,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffTime: new Date(match.utcDate),
      },
      create: {
        externalId: match.id,
        round,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffTime: new Date(match.utcDate),
      },
    });
  }

  const total = await prisma.match.count();
  console.log(`Sync complete. Match collection now has ${total} documents.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
