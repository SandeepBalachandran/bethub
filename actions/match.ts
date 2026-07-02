"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

const matchObjectSchema = z.object({
  round: z.enum(["ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"]),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  kickoffTime: z.coerce.date(),
});

function validateMatchInvariants(data: {
  homeTeamId: string;
  awayTeamId: string;
  kickoffTime: Date;
}) {
  if (data.homeTeamId === data.awayTeamId) {
    throw new Error("Home and away teams must be different.");
  }
  if (data.kickoffTime.getTime() <= Date.now()) {
    throw new Error("Kickoff time must be in the future.");
  }
}

export async function createMatch(input: z.infer<typeof matchObjectSchema>) {
  await requireAdmin();
  const data = matchObjectSchema.parse(input);
  validateMatchInvariants(data);

  const match = await prisma.match.create({ data });
  revalidatePath("/fixtures");
  return match;
}

const updateMatchSchema = matchObjectSchema.partial();

export async function updateMatch(
  matchId: string,
  input: z.infer<typeof updateMatchSchema>
) {
  await requireAdmin();
  const data = updateMatchSchema.parse(input);

  if (data.homeTeamId && data.awayTeamId && data.kickoffTime) {
    validateMatchInvariants({
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      kickoffTime: data.kickoffTime,
    });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data,
  });
  revalidatePath("/fixtures");
  revalidatePath(`/match/${matchId}`);
  return match;
}

export async function deleteMatch(matchId: string) {
  await requireAdmin();
  await prisma.match.delete({ where: { id: matchId } });
  revalidatePath("/fixtures");
}
