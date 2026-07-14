import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { invalidateUnlockTiersCache } from "@/lib/coin-rewards";

export async function GET() {
  try {
    const config = await prisma.rewardConfig.findFirst();

    if (!config) {
      // Return defaults if no config exists
      return Response.json({
        boosterCost: 100,
        thirdScorerCost: 50,
        fourthScorerCost: 150,
      });
    }

    return Response.json({
      boosterCost: config.boosterCost,
      thirdScorerCost: config.thirdScorerCost,
      fourthScorerCost: config.fourthScorerCost,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching reward config:", error);
    return Response.json(
      { error: "Failed to fetch reward config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { boosterCost, thirdScorerCost, fourthScorerCost } = body;

    // Validate inputs
    if (
      typeof boosterCost !== "number" ||
      typeof thirdScorerCost !== "number" ||
      typeof fourthScorerCost !== "number"
    ) {
      return Response.json(
        { error: "Invalid input: all costs must be numbers" },
        { status: 400 }
      );
    }

    if (
      boosterCost < 0 ||
      thirdScorerCost < 0 ||
      fourthScorerCost < 0
    ) {
      return Response.json(
        { error: "Invalid input: costs cannot be negative" },
        { status: 400 }
      );
    }

    // Upsert: find existing config or create new one
    let config = await prisma.rewardConfig.findFirst();

    if (config) {
      config = await prisma.rewardConfig.update({
        where: { id: config.id },
        data: {
          boosterCost,
          thirdScorerCost,
          fourthScorerCost,
        },
      });
    } else {
      config = await prisma.rewardConfig.create({
        data: {
          boosterCost,
          thirdScorerCost,
          fourthScorerCost,
        },
      });
    }

    // Invalidate cache so new values apply immediately
    invalidateUnlockTiersCache();

    return Response.json({
      id: config.id,
      boosterCost: config.boosterCost,
      thirdScorerCost: config.thirdScorerCost,
      fourthScorerCost: config.fourthScorerCost,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("Error updating reward config:", error);
    return Response.json(
      { error: "Failed to update reward config" },
      { status: 500 }
    );
  }
}
