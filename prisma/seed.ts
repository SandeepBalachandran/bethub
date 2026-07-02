import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PlayerFixture = { name: string; position: string };

async function seedAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env before seeding."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

async function seedPlayers() {
  const filePath = path.join(process.cwd(), "prisma", "data", "players.json");
  const raw = await readFile(filePath, "utf-8");
  const playersByFifaCode = JSON.parse(raw) as Record<string, PlayerFixture[]>;

  let linked = 0;
  let skipped = 0;

  for (const [fifaCode, players] of Object.entries(playersByFifaCode)) {
    const team = await prisma.team.findFirst({ where: { fifaCode } });

    if (!team) {
      skipped += players.length;
      continue;
    }

    for (const player of players) {
      const existing = await prisma.player.findFirst({
        where: { teamId: team.id, name: player.name },
      });

      if (existing) {
        continue;
      }

      await prisma.player.create({
        data: {
          teamId: team.id,
          name: player.name,
          position: player.position,
        },
      });
      linked++;
    }
  }

  console.log(
    `Players seeded: ${linked} created/verified, ${skipped} skipped (team not found yet — run scripts/sync-matches.ts first).`
  );
}

async function main() {
  await seedAdmin();
  await seedPlayers();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
